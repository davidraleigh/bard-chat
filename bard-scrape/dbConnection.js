/**
 * Created by davidraleigh on 5/21/15.
 */
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');

var ParseUtils = require('./parseUtils.js').ParseUtils;
var PlayDetails = require('./playComponents.js').PlayDetails;
var Dialog = require('./playComponents.js').Dialog;
var Scene = require('./playComponents.js').Scene;

// Connection URL
var url = 'mongodb://localhost:27017/bard';
// Use connect method to connect to the Server


var PlayDB = function() {
};


PlayDB.savePlay = function(playDetails, callback) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");

    PlayDB.savePlayOverview(db, playDetails, function() {
      PlayDB.saveLines(db, playDetails, function() {
        db.close();
        callback();
      });
    });
  });
};

PlayDB.savePlayOverview = function(db, playDetails, callback) {
  var playOverviewCollection = db.collection('playOverview');

  var playOverview = {
    'characters' : playDetails.getCharacters(),
    'locations' : playDetails.getLocations(),
    'otherProperNouns' : playDetails.getOtherProperNouns(),
    'allProperNouns' : playDetails.getAllProperNouns(),
    'html' : playDetails.getFullHTML()
  };
  var playOverviewSet = { '$set' : playOverview };

  playOverviewCollection.updateOne({ '_id' : playDetails.getTitle() }, playOverviewSet, { 'upsert':true }, function(err, result) {
    console.log("Inserted 3 documents into the document collection", result);
    callback(result);
  });
};

//PlayDB.saveCharacters = function(db, collection, playDetails, callback) {
//  var playOverviewCollection = db.collection('playOverview');
//  var playOverview = { 'characters' : playDetails.getCharacters() };
//  var charactersSet = { '$set' : playOverview };
//  playOverviewCollection.updateOne({ '_id' : playDetails.getTitle() }, charactersSet, { 'upsert':true }, function(err, result) {
//    console.log("Inserted 3 documents into the document collection", result);
//    callback(result);
//  });
//};
//
//PlayDB.saveLocations = function(playDetails, db, callback) {
//  var playOverviewCollection = db.collection('playOverview');
//  var playOverview = { 'locations' : playDetails.getLocations() };
//  var locationsSet = { '$set' : playOverview };
//  playOverviewCollection.updateOne({ '_id' : playDetails.getTitle() }, locationsSet, { 'upsert':true }, function(err, result) {
//    console.log("Inserted 3 documents into the document collection", result);
//    callback(result);
//  });
//};
//
//PlayDB.updateOtherProperNouns = function(playDetails, db, callback) {
//  var playOverviewCollection = db.collection('playOverview');
//  var playOverview = {  'otherProperNouns' : playDetails.getOtherProperNouns() };
//  var playOverviewSet = { '$set' : playOverview };
//  playOverviewCollection.updateOne({ '_id' : playDetails.getTitle() }, playOverviewSet, { 'upsert':true }, function(err, result) {
//    console.log("Inserted 3 documents into the document collection", result);
//    callback(result);
//  });
//};
//
//PlayDB.saveTitle = function(playDetails, db, callback) {
//
//};

//PlayDB.saveHTML = function(playDetails, db, callback) {
//
//};

PlayDB.saveSentences = function(db, playDetails, callback) {

};

PlayDB.saveLines = function(playDetails, db, callback) {

};

PlayDB.saveEndStopped = function(playDetails, db, callback) {

};

PlayDB.savePhrases = function(playDetails, db, callback) {

};


if ( typeof module !== "undefined" ) {
  exports.PlayDB = PlayDB;
}