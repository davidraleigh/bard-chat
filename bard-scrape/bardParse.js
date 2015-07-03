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
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

var ParseUtils = require('./parseUtils.js').ParseUtils;
var PlayDetails = require('./playComponents.js').PlayDetails;
var Dialog = require('./playComponents.js').Dialog;
var Scene = require('./playComponents.js').Scene;
var PlayDB = require('./dbConnection.js').PlayDB;

var jqueryURL = 'http://localhost:8080/static/jquery.js';
// DATABASE Connection URL
var url = 'mongodb://davidraleigh:ticANTiNGESulOM@ds055642-a0.mongolab.com:55642,ds055642-a1.mongolab.com:55642/bard-db?replicaSet=rs-ds055642'
//var url = 'mongodb://localhost:27017/bard';

var BardParse = function () {
  this.plays = [];
};

BardParse.parseFromJSON = function() {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    fs.readFile('mitPlays.json','utf8', function (err, data) {
      // error check
      if (err) {
        console.log(err);
        return;
      }
      // get the list of all plays and their associated URLs
      var obj =  JSON.parse(data);
      BardParse.parsePlayFromJSON(db, obj.mitLibrary, obj.mitLibrary.length - 1, function(error) {
        if (error) {
          console.log('error message: ', error);
        }
        console.log('finished parsing all plays');
      });
    });
  });
};

BardParse.parsePlayFromJSON = function(db, playArray, index, callback) {
  if (index <= 0) {//>= playArray.length) {
    callback();
    return;
  }

  var element = playArray[index];
  console.log("making request to :", element.play.href);
  request(element.play.href, function(error, response, body) {
    if (error) {
      callback(error);
      return;
    }

    console.log("completed request to :", element.play.href);
    if (!error && response.statusCode == 200) {
      //console.log(body);

      BardParse.parse(body, function(err, playDetails) {
        if (err) {
          console.log("failed database request", err);
          callback(err);
          return;
        }

        console.log("parsed :", element.play.href);
        BardParse.save(db, playDetails, function(err) {
          if (err) {
            console.log("failed database request", err);
            callback(err);
            return;
          }

          console.log("completed database save of ", element.play.href);
          playDetails = null;
          body = null;
          BardParse.parsePlayFromJSON(db, playArray, index - 1, callback);
        });
      });
    } else {
      callback(error);
      return;
    }
  });

};


// TODO REMOVE
BardParse.save = function(db, playDetails, callback) {
  PlayDB.savePlay(db, playDetails, callback);
};

BardParse.parse = function(body, callback) {
  var playDetails = new PlayDetails(body);
  jsdom.env(
    body,
    [jqueryURL],//"http://code.jquery.com/jquery.js"
    function (errors, window) {
      if (errors) {
        callback(errors);
        return;
      }
      BardParse.parseTitle(window, playDetails, function () {
        BardParse.parseLocations(window, playDetails, function () {
          BardParse.parseCharacterNames(window, playDetails, function () {
            BardParse.parseProperNouns(window, playDetails, function () {
              BardParse.parseDialog(window, playDetails, function () {
                window.close();
                playDetails.setPlayAsComplete();
                callback(null, playDetails);
              });
            });
          });
        });
      });
    }
  );
};

BardParse.parseTitle = function(window, playDetails, callback) {
  // create play object
  var jObj = window.$("td[class='play']").first();
  console.log('creating play', jObj.text());
  playDetails.setTitle(jObj.text().trim());
  callback();
};

BardParse.parseLocations = function(window, playDetails, callback) {
  // get first ACT object
  var sceneRegex = '^([Ss][Cc][Ee][Nn][Ee])\\s';

  var jObj = window.$("h3").first();

  while(jObj.length > 0) {
    if (jObj.is('h3')) {
      var hText = jObj.text();

      if (hText.match(sceneRegex)) {
        var periodIndex = hText.indexOf('.') + 1;
        var place = hText.slice(periodIndex , hText.indexOf('.', periodIndex)).trim();
        playDetails.addLocation(place);
      } else {
        console.log('parsing locaitons, leftover h3 is : ',hText);
      }
    }
    jObj = jObj.next();
  }
  callback();
};

BardParse.parseCharacterNames = function(window, playDetails, callback) {
  var jObj = window.$("h3").first();

  while(jObj.length > 0) {
    if (jObj.is('a[name^="speech"]')) {
      playDetails.addCharacter(jObj.text());
    }
    jObj = jObj.next();
  }

  callback();
};

BardParse.parseProperNouns = function(window, playDetails, callback) {
  var jObj = window.$("h3").first();

  var dialog = false;
  while(jObj.length > 0) {
    if (jObj.is('a[name^="speech"]')) {
      dialog = true;
    } else if (jObj.is('blockquote') && dialog === true) {
      // grab lines
      var lines = jObj.children("a");

      lines.each(function( index ) {
        var line = window.$(this).text();
        var allProperNouns = playDetails.getAllProperNouns().concat(ParseUtils.getTitles());
        //TODO check that titles are at end of allProperNouns list
        var proper = ParseUtils.extractProperNouns(line, allProperNouns);

        proper.forEach(function(element) {
          playDetails.addOtherProperNoun(element);
        });
      });
      dialog = false;
    }
    jObj = jObj.next();
  }

  callback();
};

BardParse.parseDialog = function(window, playDetails, callback) {
  // get first ACT object
  var actRegex = '^([Aa][Cc][Tt])\\s';
  var sceneRegex = '^([Ss][Cc][Ee][Nn][Ee])\\s';
  var prologueRegex = '^([Pp][Rr][Oo][Ll][Oo][Gg][Uu][Ee])'
  var epilogueRegex = '^([Ee][Pp][Ii][Ll][Oo][Gg][Uu][Ee])'

  var jObj = window.$("h3").first();

  var actNum = null;
  var scene = null;
  var dialog = null;
  var bInEpilogue = false;
  var bInPrologue = false;
  var peopleProperNouns = playDetails.getCharacters();
  var locationProperNouns = playDetails.getLocations();
  var otherProperNouns = playDetails.getOtherProperNouns();
  var properNouns = playDetails.getAllProperNouns().concat(ParseUtils.getTitles());
  while(jObj.length > 0) {
    if (jObj.is('h3')) {
      var hText = jObj.text();

      // SO UGLY!!!!! Henry IV prologue work around
      if (hText.match('None')) {
        actNum = 1;
        bInPrologue = true;
      }
      // save scene if necessary
      // TODO add epilogue?
      if ((hText.match(actRegex) || hText.match(sceneRegex)) && scene !== null){
        //console.log(scene.toString());
        playDetails.addScene(actNum, scene);
      }


      if (hText.match(actRegex)) {
        var romanNumeral = hText.slice(hText.toLowerCase().indexOf('act ') + 4);
        actNum = toArabic(romanNumeral);
        console.log('parsing Act ', actNum);
        // null out scene object
        scene = null;
        // there are cases where the prologue isn't announced in the html, to
        // handle that we always assume there may be a prologue immediately following
        // an new act declaration in the html
        bInPrologue = true;
      } else if (hText.match(sceneRegex)) {
        var romanNumeral = hText.slice(hText.toLowerCase().indexOf('scene ') + 6, hText.indexOf('.'));
        var sceneNum = toArabic(romanNumeral);
        console.log('parsing Act: ', actNum, ', Scene: ', sceneNum);
        scene = new Scene(sceneNum, hText.slice(hText.indexOf('.') + 1).trim());
        // there are cases where the prologue isn't announced in the html, to
        // handle that we always assume there may be a prologue immediately following
        // an new act declaration in the html. if there wasn't a declaration then
        // we must set it back to false
        bInPrologue = false;
      } else if (hText.match(prologueRegex)) {
        bInPrologue = true;
      } else if (hText.match(epilogueRegex)) {
        console.log('Parsing epilogue');
        bInEpilogue = true;
      } else {
        console.log('Error with h3!!', hText);
      }
    } else if (jObj.is('a[name^="speech"]') && /*this here is because a dialog for prologue and epilogue will already have been created*/ dialog === null) {
      // grab player name to create new Dialog block
      // GODDAM HENRY THE 5th
      if (bInEpilogue) {
        dialog = new Dialog(jObj.text(), 'epilogue');
      } else {
        dialog = new Dialog(jObj.text());
      }
    } else if (jObj.is('blockquote') && dialog !== null && /*this part here is for epilogue and prologue --> */jObj.children('a').length > 0) {
      // grab lines
      var lines = jObj.children("a");
      lines.each(function() {
        var lineText = window.$(this).text();
        // GODDAM IT HENRY THE V!!!!!!
        if (lineText === 'EPILOGUE') {
          bInEpilogue = true;
          return;
        }

        var lineNumber = window.$(this).attr("NAME");
        var proper = ParseUtils.extractProperNouns(lineText);
        var linePeople = peopleProperNouns.filter(function(n) {
          return proper.indexOf(n) != -1
        });
        var lineLocations = locationProperNouns.filter(function(n) {
          return proper.indexOf(n) != -1
        });
        var lineOthersNouns = otherProperNouns.filter(function(n) {
          return proper.indexOf(n) != -1
        });
        dialog.addLine(lineText, lineNumber, linePeople, lineLocations, lineOthersNouns);
      });

      scene.addDialogue(dialog, properNouns);

      dialog = null;
    } else if (jObj.is('blockquote')) {
      var lastStageDirection = jObj.text();
      if (lastStageDirection.indexOf("Enter") > -1) {
        var player = lastStageDirection.slice(lastStageDirection.indexOf("Enter") + 5).trim();
        if (bInPrologue) {
          scene = new Scene('PROLOGUE', '');
          // with all prologues we always assume that they will be
          // followed by a stage direction for the speaker who enters
          // and gives the prologue. if this is false, there will be bugs
          dialog = new Dialog(player, 'prologue');
          console.log('Parsing prologue');
          bInPrologue = false;
        } else if (bInEpilogue) {
          scene = new Scene('EPILOGUE', '');
          dialog = new Dialog(player, 'epilogue');
          bInEpilogue = false;
        }
      }
    }
    jObj = jObj.next();
  }
  // add last scene
  playDetails.addScene(actNum, scene);
  console.log("all proper nouns: \n",playDetails.getAllProperNouns());

  callback();
};

BardParse.parseFromHTMLFile = function(filename) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");

    fs.readFile(filename, 'utf8', function (error, body) {
      if (!error) {
        BardParse.parse(body, function(playDetails) {
          BardParse.save(db, playDetails, function(err) {
            if (err)
              console.log("failed database request", err);
            else
              console.log("completed database request");
          });
        });
      } else {
        console.log(error);
      }
    });
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