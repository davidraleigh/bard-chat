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

var ParseUtils = require('./parseUtils.js').ParseUtils;
var PlayDetails = require('./playComponents.js').PlayDetails;
var Dialog = require('./playComponents.js').Dialog;
var Scene = require('./playComponents.js').Scene;
var PlayDB = require('./dbConnection.js').PlayDB;

var jqueryURL = 'http://localhost:8080/static/jquery.js';
//var $ = require('jquery')(require("jsdom").jsdom().parentWindow);


var BardParse = function () {
  this.plays = [];
};

// TODO delete this
//BardParse.parseProperNouns = function(text) {
//  return ParseUtils.extractProperNouns(text);
//}

BardParse.parsePlayFromJSON = function(playArray, index, callback) {
  if (index >= playArray.length) {
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

      BardParse.parse(body, function(playDetails) {
        console.log("parsed :", element.play.href);
        BardParse.save(playDetails, function(err) {
          if (err) {
            console.log("failed database request", err);
            callback(error);
            return;
          }

          console.log("completed database save of ", element.play.href);
          BardParse.parsePlayFromJSON(playArray, index + 1, callback);
        });
      });
    } else {
      callback(error);
      return;
    }
  });

}

BardParse.parseFromJSON = function() {
  fs.readFile('mitPlays.json','utf8', function (err, data) {
    // error check
    if (err) {
      console.log(err);
      return;
    }
    // get the list of all plays and their associated URLs
    var obj =  JSON.parse(data);
    BardParse.parsePlayFromJSON(obj.mitLibrary, 0, function() {
      console.log('finished parsing all plays');
    });
    for (var i = 0; i < obj.mitLibrary.length; i++) {
      var element = obj.mitLibrary[i];
      console.log("making request to :", element.play.href);
      request(element.play.href, function(error, response, body) {

        console.log("completed request to :", element.play.href);
        if (!error && response.statusCode == 200) {
          //console.log(body);

          BardParse.parse(body, function(playDetails) {
            console.log("parsed :", element.play.href);
            BardParse.save(playDetails, function(err) {
              if (err)
                console.log("failed database request", err);
              else
                console.log("completed database save of ", element.play.href);

            });
          });

        }
      });
    };
    // TODO save to database
  });
};

BardParse.save = function(playDetails, callback) {
  PlayDB.savePlay(playDetails, callback);
};

BardParse.parse = function(body, callback) {
  var playDetails = new PlayDetails(body);
  BardParse.parseTitle(body, playDetails, function() {
    BardParse.parseLocations(body, playDetails, function() {
      BardParse.parseCharacterNames(body, playDetails, function() {
        BardParse.parseProperNouns(body, playDetails, function() {
          BardParse.parseDialog(body, playDetails, function() {
            callback(playDetails);
          });
        });
      });
    });
  });
};

BardParse.parseLocations = function(body, playDetails, callback) {
  // get first ACT object
  var sceneRegex = '^([Ss][Cc][Ee][Nn][Ee])\\s';

  jsdom.env(
    body,
    [jqueryURL],//"http://code.jquery.com/jquery.js"
    function (errors, window) {
      if (errors) {
        console.log(errors);
        return;
      }

      var jObj = window.$("h3").first();

      while(jObj.length > 0) {
        if (jObj.is('h3')) {
          var hText = jObj.text();

          if (hText.match(sceneRegex)) {
            var periodIndex = hText.indexOf('.') + 1;
            var place = hText.slice(periodIndex , hText.indexOf('.', periodIndex)).trim();
            playDetails.addLocation(place);
          } else {
            console.log(hText);
          }
        }
        jObj = jObj.next();
      }

      callback();
    }
  );
};

BardParse.parseProperNouns = function(body, playDetails, callback) {
  jsdom.env(
    body,
    [jqueryURL],
    function (errors, window) {
      if (errors) {
        console.log(errors);
        return;
      }

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
    }
  );
}

BardParse.parseCharacterNames = function(body, playDetails, callback) {
  jsdom.env(
    body,
    [jqueryURL],
    function (errors, window) {
      if (errors) {
        console.log(errors);
        return;
      }

      var jObj = window.$("h3").first();

      while(jObj.length > 0) {
        if (jObj.is('a[name^="speech"]')) {
          playDetails.addCharacter(jObj.text());
        }
        jObj = jObj.next();
      }
      callback();
    }
  );
}

BardParse.parseTitle = function(body, playDetails, callback) {
  jsdom.env(
    body,
   [jqueryURL],
    function (errors, window) {
      if (errors) {
        console.log(errors);
        return;
      }

      // create play object
      var jObj = window.$("td[class='play']").first();
      console.log('creating play', jObj.text());
      playDetails.setTitle(jObj.text().trim());
      callback();
    }
  );
}

BardParse.parseDialog = function(body, playDetails, callback) {
  // get first ACT object
  var actRegex = '^([Aa][Cc][Tt])\\s';
  var sceneRegex = '^([Ss][Cc][Ee][Nn][Ee])\\s';

  jsdom.env(
    body,
    [jqueryURL],
    function (errors, window) {
      if (errors) {
        console.log(errors);
        return;
      }

      var jObj = window.$("h3").first();

      var actNum = null;
      var scene = null;
      var dialog = null;
      var peopleProperNouns = playDetails.getCharacters();
      var locationProperNouns = playDetails.getLocations();
      var otherProperNouns = playDetails.getOtherProperNouns();
      var properNouns = playDetails.getAllProperNouns().concat(ParseUtils.getTitles());
      while(jObj.length > 0) {
        if (jObj.is('h3')) {
          var hText = jObj.text();

          // save scene if necessary
          if ((hText.match(actRegex) || hText.match(sceneRegex)) && scene !== null){
            //console.log(scene.toString());
            playDetails.addScene(actNum, scene);
          }


          if (hText.match(actRegex)) {
            var romanNumeral = hText.slice(hText.toLowerCase().indexOf('act ') + 4);
            actNum = toArabic(romanNumeral);
            // null out scene object
            scene = null;
          } else if (hText.match(sceneRegex)) {
            var romanNumeral = hText.slice(hText.toLowerCase().indexOf('scene ') + 6, hText.indexOf('.'));
            //console.log(hText);
            var sceneNum = toArabic(romanNumeral);
            scene = new Scene(sceneNum, hText.slice(hText.indexOf('.') + 1).trim());
          } else {
            console.log('Error with h3!!', hText);
          }
        } else if (jObj.is('a[name^="speech"]')) {
          // grab player name to create new Dialog block
          dialog = new Dialog(jObj.text());
        } else if (jObj.is('blockquote') && dialog !== null) {
          // grab lines
          var lines = jObj.children("a");
          lines.each(function( index ) {
            var lineText = window.$(this).text();
            //console.log(lineText);
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
          console.log('stage direction: ', jObj.text());
        }
        jObj = jObj.next();
      }
      // add last scene
      playDetails.addScene(actNum, scene);
      console.log("all proper nouns: \n",playDetails.getAllProperNouns());

      callback();
    }
  );
};

BardParse.parseFromHTMLFile = function(filename) {
  fs.readFile(filename, 'utf8', function (error, body) {
    if (!error) {
      BardParse.parse(body, function(playDetails) {
          BardParse.save(playDetails, function(err) {
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