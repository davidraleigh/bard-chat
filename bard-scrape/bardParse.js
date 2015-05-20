/**
 * Created by davidraleigh on 5/17/15.
 */

/*jshint strict:false */
//'use strict';

//var md5 = require("MD5");
//var querystring = require("querystring");
//var url = require("url");
//var jf = require("jsonfile");
//var path = require("path");
var fs = require("fs");
var request = require('request');
var jsdom = require("jsdom");
var toArabic = require('roman-numerals').toArabic;

var Dialog = function(speaker) {
    this.character = speaker;
    this.lines = [];
    this.sentences = [];
    var prev = null;
    var next = null;
};

Dialog.prototype.addLine = function(line) {
    this.lines.push(line);
};

Dialog.prototype.getCharacter = function() {
    return this.character;
}

Dialog.prototype.getLines = function() {
    return this.lines;
};

Dialog.prototype.linesToSentences = function() {
    var currentSentence = "";
    var currentLine = null;
    for (var i = 0; i < this.lines.length; i++) {
        // get the current line
        currentLine = this.lines[i];
        // split the line by regex for sentence endings
        var result = currentLine.match( /[^\.!\?]+[\.!\?]+/g );
        // if there are no splits then the whole line is part of another sentence
        if (result === null) {
            if (currentSentence.trim().length > 0)
                // if there is a current sentence add this sentence to it
                // TODO keep proper nouns and I capitalized
                currentSentence = currentSentence + " " + currentLine[0].toLowerCase() + currentLine.slice(1);
            else
                // if there isn't a current sentence, start it from this line
                currentSentence = currentLine.slice(0);
            continue;
        }

        result = currentLine.match( /[^\.!\?]+([\.!\?]|$)+/g );
        // if there is a previous sentence
        if (currentSentence.trim().length > 0) {
            // TODO keep proper nouns and I capitalized
            this.sentences.push(currentSentence + " " + result[0][0].toLowerCase() + result[0].slice(1));
        } else {
            this.sentences.push(result[0]);
        }

        for (var j = 1; j < result.length - 1; j++) {
            this.sentences.push(result[j].trim());
        }
        if (result.length > 1) {
            currentSentence = result[result.length - 1].trim();
        } else {
            currentSentence = "";
        }
    }
    if (currentSentence.trim().length > 0) {
        this.sentences.push(currentSentence);
    }
};

Dialog.prototype.getSentences = function() {
  return this.sentences.slice();
}


var Scene = function(sceneNumber, location) {
    this.dialogs = [];
    this.firstDialog = null;
    this.lastDialog = null;
    this.sceneNumber = sceneNumber;
    this.location = location;
};

Scene.prototype.toString = function() {
    var result = "";
    for (var i = 0; i < this.dialogs.length; i++) {
        result += this.dialogs[i].getCharacter() + '\\n';
        var lines = this.dialogs[i].getLines();
        for (var j = 0; j < lines.length; j++) {
            result += lines[j] + '\\n';
        }
    }
    return result;
}

Scene.prototype.addDialogue = function(dialog) {
    dialog.linesToSentences();

    if (this.firstDialog === null) {
        this.firstDialog = dialog;
        this.lastDialog = dialog;
    } else {
        dialog.prev = this.lastDialog;
        this.lastDialog.next = dialog;
        this.lastDialog = dialog;
    }
    this.dialogs.push(dialog);
};

// play.act.scene
var PlayDetails = function(title) {
    this.title = title;
    // hash map of act number keys and scene object arrays
    // this.acts = {1: [sceneObj1, sceneObj2], 2: [sceneObj1]};
    this.acts = {};
    this.characterSet = [];
    this.characterMap = {};
};

PlayDetails.prototype.addScene = function(actNumber, scene) {
    if (this.acts[actNumber]  === undefined)
        this.acts[actNumber] = [];
    this.acts[actNumber].push(scene);
};

PlayDetails.prototype.addCharacter = function(name) {
  if (name in this.characterMap)
    return;
  this.characterMap[name] = true;
  this.characterSet.push(name);
}

var BardParse = function () {
    this.plays = {};
};

BardParse.prototype.parseProperNouns = function(text) {
  text = text.trim();
  //var re = /[\n\t ][A-Z][a-z]+/g;
  var reCapitalized = "[A-Z][a-z]+";
  var reSeparator = "( (de|of) )";
  var titles = ['Lord', 'Count', 'Captain', 'King', 'Countess', 'Prince', 'Princess'];
  var reTitles = titles.reduce(function(previousValue, currentValue, index) {
    if (index === 1)
      return '(' + previousValue + ' )|(' + currentValue + ' )';
    return previousValue + '|(' + currentValue + ' )';
  });
  //var re =     /[\n\t ](((Lord )|(Count )|(Countess )|(Captain )[A-Z][a-z]+)|([A-Z][a-z]+( de )[A-Z][a-z]+)|([A-Z][a-z]+))/g
  //               (((Lord )|(Count )|(Countess )|(Captain )[A-Z][a-z]+)|([A-Z][a-z]+( de )[A-Z][a-z]+)|([A-Z][a-z]+))
  var rePronoun = "(((" + reTitles + ')' + reCapitalized + ")|("  + reCapitalized + reSeparator + reCapitalized + ")|(" + reCapitalized + "))";
  var reSpace = "[\\n\\t ]";

  //var re =     /[\n\t ]    ((    [A-Z][a-z]+     ( de )        [A-Z][a-z]+      )|(    [A-Z][a-z]+      ))/g;
  var reCapture = reSpace + rePronoun;
  var re = new RegExp(reCapture, "g");

  var match = null;
  var properNounMap = {};
  // collect all words that start with a capital letter
  while ((match = re.exec(text)) != null) {
    var properNoun = text.slice(match.index + 1, match.index + match[0].length);
    properNounMap[match.index + match[0].length] = properNoun;
  }

  // remove any words that start with a capital letter but are preceded by a . ? or !
  //re = /[\?\.!\]][\n\t ]+[A-Z][a-z]+/g;
  var reEnd = "[\\?\\.!\\]]";
  //re = /[\?\.!\]][\n\t ]+(([A-Z][a-z]+( de )[A-Z][a-z]+)|([A-Z][a-z]+))/g;
  var reExclude = reEnd + reSpace + "+" + rePronoun;
  re = new RegExp(reExclude, 'g');

  while((match = re.exec(text)) != null) {
    var key = match.index + match[0].length + "";
    if (key in properNounMap) {
      delete properNounMap[key];
    }
  }

  function sortNumber(a,b) {
    return parseInt(a) - parseInt(b);
  }

  var results = [];
  var vals = Object.keys(properNounMap).sort(sortNumber);
  vals.forEach(function(key) {
    results.push(properNounMap[key]);
  });

  return results;
}

BardParse.prototype.parseFromMIT = function() {

    var parseBound = this.parseFromMIThtml.bind(this);
    fs.readFile('mitPlays.json','utf8', function (err, data) {
        // error check
        if (err) {
            console.log(err);
            return;
        }

        // get the list of all plays and their associated URLs
        var obj =  JSON.parse(data);
        obj.mitLibrary.forEach(function(element, index, array) {

            console.log("making request to :", element.play.href);
            request(element.play.href, function(error, response, body) {

                console.log("completed request to :", element.play.href);
                if (!error && response.statusCode == 200) {
                    console.log(body);
                    parseBound(body);
                    console.log("parsed :", element.play.href);
                }
            });
        });
    });
};

var properNamesFromHTML = function (body, playDetails) {
  var properNounRegex = '([A-Za-z]( )+[A-Z][a-z]+)+';
}

BardParse.prototype.parseFromMIThtml = function(body, callback) {
    // get first ACT object
    var actRegex = '^([Aa][Cc][Tt])\\s';
    var sceneRegex = '^([Ss][Cc][Ee][Nn][Ee])\\s';

    jsdom.env(
        body,
        ["http://code.jquery.com/jquery.js"],
        function (errors, window) {
            if (errors) {
                console.log(errors);
                return;
            }

            // create play object
            var jObj = window.$("td[class='play']").first();
            console.log('creating play', jObj.text());
            var playDetails = new PlayDetails(jObj.text().trim());

            jObj = window.$("h3").first();

            var actNum = null;
            var scene = null;
            var dialog = null;
            while(jObj.length > 0) {
                if (jObj.is('h3')) {
                    var hText = jObj.text();
                    // save scene if necessary
                    if ((hText.match(actRegex) || hText.match(sceneRegex)) && scene !== null)
                        playDetails.addScene(actNum, scene);

                    if (hText.match(actRegex)) {
                        var romanNumeral = hText.slice(hText.toLowerCase().indexOf('act ') + 4);
                        actNum = toArabic(romanNumeral);
                        // null out scene object
                        scene = null;
                    } else if (hText.match(sceneRegex)) {
                        var romanNumeral = hText.slice(hText.toLowerCase().indexOf('scene ') + 6, hText.indexOf('.'));
                        console.log(hText);
                        var sceneNum = toArabic(romanNumeral);
                        scene = new Scene(sceneNum, hText.slice(hText.indexOf('.') + 1).trim());
                    } else {
                        console.log('Error with h3!!');
                    }
                } else if (jObj.is('a[name^="speech"]')) {
                    // grab player name
                    var name = jObj.text();
                    playDetails.addCharacter(name);
                    dialog = new Dialog(name);
                } else if (jObj.is('blockquote') && dialog !== null) {
                    // grab lines
                    var lines = jObj.children("a");
                    lines.each(function( index ) {
                        var line = window.$(this).text();
                        var proper = BardParse.prototype.parseProperNouns(line);

                        proper.forEach(function(element) { console.log( ":", element);});
                        dialog.addLine(window.$( this ).text());
                    });

                    scene.addDialogue(dialog);
                    dialog = null;
                } else if (jObj.is('blockquote')) {
                    console.log('stage direction: ', jObj.text());
                }
                jObj = jObj.next();
            }
        }
    );
};

BardParse.prototype.parseFromMIThtmlFile = function(filename) {
    var parseBound = this.parseFromMIThtml.bind(this);
    fs.readFile(filename, 'utf8', function (error, body) {
        if (!error) {
            parseBound(body);
        }
    });
};

var requestHandler = function(request, response) {

    // console.log("Serving request type " + request.method + " for url " + request.url);

    if (request.method === 'OPTIONS') {
        sendResponse(response, 'CORS request granted');

    } else if (request.method === "GET") {
        var queryObj = parseQuery(request.url);

        if (!queryObj.limit) {
            // if we're not responding to a specific GET request
            sendFiles(request.url, response);

        } else {
            // if we are responding to a request to GET messages
            //var results = db.retrieve(queryObj.limit, queryObj.order, queryObj.filter, queryObj.target);
            sendResponse(response, JSON.stringify("{}"), 200);
        }
    } else if (request.method === "POST") {

        var statusCode = 201;
        var headers = defaultCorsHeaders;
        headers['Content-Type'] = "text/plain";
        response.writeHead(statusCode, headers);

        var data = "";

        request.on('data', function(chunk) {
            data += chunk;
        });

        request.on('end', function() {
            console.log(data);
            //db.add(data);
            response.end('successful message post!');
        });

        // console.log('data to be posted is:', data);

    } else {

        // TODO: FIX THIS
        //var statusCode = 400;
    }

};

// These headers will allow Cross-Origin Resource Sharing (CORS).
// This code allows this server to talk to websites that
// are on different domains, for instance, your chat client.
//
// Your chat client is running from a url like file://your/chat/client/index.html,
// which is considered a different domain.
//
// Another way to get around this restriction is to serve you chat
// client from this domain by setting up static file serving.



if ( typeof module !== "undefined" ) {
  exports.BardParse = BardParse;
  exports.Dialog = Dialog;
  exports.requestHandler = requestHandler;
}