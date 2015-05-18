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

var dialogue = function() {
    var character = "";
    var lines = [];
    var sentences = [];
    var prev = null;
    var next = null;
};

var Scene = function(sceneNumber, location) {
    this.dialogs = [];
    this.firstDialog = null;
    this.lastDialog = null;
    this.sceneNumber = sceneNumber;
    this.location = location;
};

Scene.prototype.addDialogue = function(dialog) {
    if (this.firstDialog === null) {
        this.firstDialog = dialog;
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
};

PlayDetails.prototype.addScene = function(actNumber, scene) {
    if (this.acts[actNumber]  === undefined)
        this.acts = [];
    this.acts[actNumber].push(scene);
};

var BardParse = function () {
    this.plays = {};
};

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
            var playDetails = new PlayDetails(jObj.text());

            jObj = window.$("h3").first();

            var actNum = null;
            var sceneNum = null;
            var scene = null;
            while(jObj.length > 0) {
                if (jObj.is('h3')) {
                    var hText = jObj.text();
                    if (hText.match(actRegex)) {
                        var romanNumeral = hText.slice(hText.toLowerCase().indexOf('act ') + 4);
                        console.log(romanNumeral);
                        actNum = toArabic(romanNumeral);
                    } else if (hText.match(sceneRegex)) {
                        var romanNumeral = hText.slice(hText.toLowerCase().indexOf('scene ') + 6, hText.indexOf('.'));
                        console.log(romanNumeral);
                        sceneNum = toArabic(romanNumeral);
                    } else {
                        console.log('Error with h3!!');
                    }
                    // grab act number
                    console.log(hText);
                    // grab scene number
                    if (scene !== null) {
                        // store old scene in playDetails
                    }
                } else if (jObj.is('a[name^="speech"]')) {
                    // grab player name
                    console.log(jObj.text());
                } else if (jObj.is('blockquote')) {
                    // grab lines
                    var lines = jObj.children("a");
                    // print lines
                    lines.each(function( index ) {
                        console.log( index + ": " + window.$( this ).text() );
                    });
                } else {
                    console.log('stage direction? ', jObj.text());
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
    exports.requestHandler = requestHandler;
}