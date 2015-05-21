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




var BardParse = function () {
  this.plays = [];
};

// TODO delete this
//BardParse.parseProperNouns = function(text) {
//  return ParseUtils.extractProperNouns(text);
//}

BardParse.parseFromJSON = function() {
  fs.readFile('mitPlays.json','utf8', function (err, data) {
    // error check
    if (err) {
      console.log(err);
      return;
    }
    var processedPlays = [];
    // get the list of all plays and their associated URLs
    var obj =  JSON.parse(data);
    obj.mitLibrary.forEach(function(element, index, array) {

      console.log("making request to :", element.play.href);
      request(element.play.href, function(error, response, body) {

        console.log("completed request to :", element.play.href);
        if (!error && response.statusCode == 200) {
          //console.log(body);

          BardParse.parse(body, function(playDetails) {
            processedPlays.push(playDetails);
          });
          console.log("parsed :", element.play.href);
        }
      });
    });
  });
};

BardParse.parse = function(body, callback) {
  var playDetails = new PlayDetails(body);
  BardParse.parseTitle(body, playDetails, function() {
    BardParse.parseLocations(body, playDetails, function() {
      BardParse.parseCharacterNames(body, playDetails, function() {
        BardParse.parseFromHTML(body, playDetails, function() {
          callback(playDetails);
        });
      });
    });
  });
}

BardParse.parseLocations = function(body, playDetails, callback) {
  // get first ACT object
  var sceneRegex = '^([Ss][Cc][Ee][Nn][Ee])\\s';

  jsdom.env(
    body,
    ["http://code.jquery.com/jquery.js"],
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
            console.log(hText);
            var periodIndex = hText.indexOf('.') + 1;
            var place = hText.slice(periodIndex , hText.indexOf('.', periodIndex)).trim();
            playDetails.addLocation(place);
          } else {
            console.log('Error with h3!!', hText);
          }
        }
        jObj = jObj.next();
      }

      callback();
    }
  );
};

BardParse.parseCharacterNames = function(body, playDetails, callback) {
  jsdom.env(
    body,
    ["http://code.jquery.com/jquery.js"],
    function (errors, window) {
      if (errors) {
        console.log(errors);
        return;
      }

      var jObj = window.$("h3").first();

      var dialog = false;
      var locations = playDetails.getLocations().slice();
      var locationtTitles = ParseUtils.getTitles();
      Array.prototype.push(locationtTitles, locations);

      while(jObj.length > 0) {
        if (jObj.is('a[name^="speech"]')) {
          playDetails.addCharacter(jObj.text());
          dialog = true;
        } else if (jObj.is('blockquote') && dialog === true) {
          // grab lines
          var lines = jObj.children("a");
          var properNouns = playDetails.getCharacters().slice();
          Array.prototype.push(properNouns, locationtTitles);
          console.log("Proper nouns", properNouns);

          lines.each(function( index ) {
            var line = window.$(this).text();
            var proper = ParseUtils.extractProperNouns(line, properNouns);

            proper.forEach(function(element) { console.log( element, "\t:", line);});
            playDetails.addCharacter(proper);
          });
          dialog = false;
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
    ["http://code.jquery.com/jquery.js"],
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

BardParse.parseFromHTML = function(body, playDetails, callback) {
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

      var jObj = window.$("h3").first();

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
          // grab player name to create new Dialog block
          dialog = new Dialog(jObj.text());
        } else if (jObj.is('blockquote') && dialog !== null) {
          // grab lines
          var lines = jObj.children("a");
          lines.each(function( index ) {
            var line = window.$(this).text();
            var proper = ParseUtils.extractProperNouns(line);

            proper.forEach(function(element) { console.log( element, "\t:", line);});
            dialog.addLine(window.$(this).text());
          });

          scene.addDialogue(dialog);
          dialog = null;
        } else if (jObj.is('blockquote')) {
          console.log('stage direction: ', jObj.text());
        }
        jObj = jObj.next();
      }
      callback();
    }
  );
};

BardParse.parseFromHTMLFile = function(filename) {
  fs.readFile(filename, 'utf8', function (error, body) {
    if (!error) {
      BardParse.parse(body);
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