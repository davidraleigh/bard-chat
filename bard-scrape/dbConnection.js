/**
 * Created by davidraleigh on 5/21/15.
 */
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var ObjectID = require('mongodb').ObjectID;


var ParseUtils = require('./parseUtils.js').ParseUtils;
var PlayDetails = require('./playComponents.js').PlayDetails;
var Dialog = require('./playComponents.js').Dialog;
var Scene = require('./playComponents.js').Scene;

// Connection URL
var url = 'mongodb://localhost:27017/bard';


var PlayDB = function() {
};

PlayDB.savePlay = function(playDetails, callback) {
  MongoClient.connect(url, function(err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server");
    var playOverviewCollection = db.collection('playOverview');
    playOverviewCollection.deleteMany({'playTitle' : playDetails.getTitle()}, function(err, reply) {
      PlayDB.savePlayOverview(db, playDetails, function() {
        PlayDB.saveScenes(db, playDetails, callback);
      });
    });
  });
};

PlayDB.savePlayOverview = function(db, playDetails, callback) {
  var playOverviewCollection = db.collection('playOverview');

  var playOverview = {
    'playTitle' : playDetails.getTitle(),
    'characters' : playDetails.getCharacters(),
    'locations' : playDetails.getLocations(),
    'otherProperNouns' : playDetails.getOtherProperNouns(),
    'allProperNouns' : playDetails.getAllProperNouns(),
    'html' : playDetails.getFullHTML()
  };
  var playOverviewSet = { '$set' : playOverview };

  playOverviewCollection.updateOne({ 'playTitle' : playDetails.getTitle() }, playOverviewSet, { 'upsert':true }, function(err, result) {
    console.log("Inserted play overview", result.result);
    if (callback)
      callback();
  });
};

PlayDB.saveScenes = function(db, playDetails, callback) {
  var sentencesCollection = db.collection('sentences');
  var linesCollection = db.collection('lines');
  var endStoppedCollection = db.collection('endStopped');
  var phrasesCollection = db.collection('phrases');
  sentencesCollection.deleteMany({'playTitle' : playDetails.getTitle()}, function() {
    linesCollection.deleteMany({'playTitle' : playDetails.getTitle()}, function() {
      endStoppedCollection.deleteMany({'playTitle' : playDetails.getTitle()}, function() {
        phrasesCollection.deleteMany({'playTitle' : playDetails.getTitle()}, function () {
          PlayDB.saveScene(db, playDetails, 1, 1, callback);
        });
      });
    });
  });
};

PlayDB.saveScene = function(db, playDetails, actNumber, sceneNumber, callback) {
  if (!playDetails.hasScene(actNumber, sceneNumber)) {
    actNumber += 1;
    sceneNumber = 1;
    if (!playDetails.hasScene(actNumber, sceneNumber)) {
      callback();
      return;
    }
  }

  var scene = playDetails.getScene(actNumber, sceneNumber);
  PlayDB.insertSceneSentences(db, playDetails, scene, actNumber, function() {
    PlayDB.insertSceneLines(db, playDetails, scene, actNumber, function() {
      PlayDB.insertEndStopped(db, playDetails, scene, actNumber, function() {
        PlayDB.insertPhrases(db, playDetails, scene, actNumber, function () {
          PlayDB.saveScene(db, playDetails, actNumber, sceneNumber + 1, callback);
        });
      });
    });
  });
};

PlayDB.insertSceneLines = function(db, playDetails, scene, actNumber, callback) {
  var play = playDetails.getTitle();
  var filterObject = {'playTitle' : playDetails.getTitle()};
  var sceneNumber = scene.getSceneNumber();
  var insertArray = [];
  scene.getDialogs().forEach(function(dialog) {
    var speaker = dialog.getCharacter();
    dialog.getLines(true).forEach(function(upsertLineObject) {
      filterObject['lineNumber'] = upsertLineObject.lineNumber;
      // TODO should all this be moved into Dialog class?
      upsertLineObject['actNumber'] = actNumber;
      upsertLineObject['sceneNumber'] = sceneNumber;
      upsertLineObject['playTitle'] = play;
      upsertLineObject['speaker'] = speaker;
      upsertLineObject['_id'] = new ObjectID();
      insertArray.push(upsertLineObject);
    });
  });


  var linesCollection = db.collection('lines');
  linesCollection.insertMany(insertArray.slice(), { wtimeout: 5000 , w:1}, function(err, result) {
    if (err) {
      console.log(err);
    }
    console.log("insert lines: ", result.result);
    if (callback)
      callback();
  });
};

PlayDB.insertSceneSentences = function(db, playDetails, scene, actNumber, callback) {
  /*
    'sentenceText' : sentenceText,
    'rangeStart' : lineNumberStart,
    'rangeEnd' : lineNumberEnd,
    'ICount' : ParseUtils.getWordOccurence(sentenceText, ' I ', false),
    'youCount' : ParseUtils.getWordOccurence(sentenceText.toLowerCase(), ' you ', false),
    'heCount' : ParseUtils.getWordOccurence(sentenceText.toLowerCase(), ' he ', false),
    'sheCount' : ParseUtils.getWordOccurence(sentenceText.toLowerCase(), ' she ', false),
    'theyCount' : ParseUtils.getWordOccurence(sentenceText.toLowerCase(), ' they ', false),
    'weCount' : ParseUtils.getWordOccurence(sentenceText.toLowerCase(), ' we ', false),
    'people' : people || [],
    'locations' : locations || [],
    'other' : other || [],
    'characterCount' : sentenceText.length,
    'type' : sentenceType
  */
  var play = playDetails.getTitle();
  //var filterObject = {'playTitle' : playDetails.getTitle()};
  var sceneNumber = scene.getSceneNumber();
  var insertArray = [];
  scene.getDialogs().forEach(function(dialog) {
    var speaker = dialog.getCharacter();
    dialog.getSentences(true).forEach(function(upsertSentenceObject) {
      //filterObject['lineNumber'] = upsertSentenceObject.lineNumber;
      // TODO should all this be moved into Dialog class?
      upsertSentenceObject['actNumber'] = actNumber;
      upsertSentenceObject['sceneNumber'] = sceneNumber;
      upsertSentenceObject['playTitle'] = play;
      upsertSentenceObject['speaker'] = speaker;
      upsertSentenceObject['_id'] = new ObjectID();
      insertArray.push(upsertSentenceObject);
    });
  });

  var sentencesCollection = db.collection('sentences');
  sentencesCollection.insertMany(insertArray.slice(), { wtimeout: 5000 , w:1}, function(err, result) {
    if (err) {
      console.log(err);
    }
    console.log("insert sentences: ", result.result);
    callback();
  });
};

PlayDB.insertEndStopped = function(db, playDetails, scene, actNumber, callback) {
  var play = playDetails.getTitle();
  //var filterObject = {'playTitle' : playDetails.getTitle()};
  var sceneNumber = scene.getSceneNumber();
  var insertArray = [];
  scene.getDialogs().forEach(function(dialog) {
    var speaker = dialog.getCharacter();
    dialog.getEndStopped(true).forEach(function(upsertEndStoppedObject) {
      //filterObject['lineNumber'] = upsertEndStoppedObject.lineNumber;
      // TODO should all this be moved into Dialog class?
      upsertEndStoppedObject['actNumber'] = actNumber;
      upsertEndStoppedObject['sceneNumber'] = sceneNumber;
      upsertEndStoppedObject['playTitle'] = play;
      upsertEndStoppedObject['speaker'] = speaker;
      upsertEndStoppedObject['_id'] = new ObjectID();
      insertArray.push(upsertEndStoppedObject);
    });
  });

  var endStoppedCollection = db.collection('endStopped');
  endStoppedCollection.insertMany(insertArray.slice(), { wtimeout: 5000 , w:1}, function(err, result) {
    if (err) {
      console.log(err);
    }
    console.log("insert endStopped: ", result.result);
    if (callback)
      callback();
  });
};

PlayDB.insertPhrases = function(db, playDetails, scene, actNumber, callback) {
  var play = playDetails.getTitle();
  //var filterObject = {'playTitle' : playDetails.getTitle()};
  var sceneNumber = scene.getSceneNumber();
  var insertArray = [];
  scene.getDialogs().forEach(function(dialog) {
    var speaker = dialog.getCharacter();
    dialog.getPhrases(true).forEach(function(upsertPhrasesObject) {
      //filterObject['lineNumber'] = upsertPhrasesObject.lineNumber;
      // TODO should all this be moved into Dialog class?
      upsertPhrasesObject['actNumber'] = actNumber;
      upsertPhrasesObject['sceneNumber'] = sceneNumber;
      upsertPhrasesObject['playTitle'] = play;
      upsertPhrasesObject['speaker'] = speaker;
      upsertPhrasesObject['_id'] = new ObjectID();
      insertArray.push(upsertPhrasesObject);
    });
  });

  var phrasesCollection = db.collection('phrases');
  phrasesCollection.insertMany(insertArray.slice(), { wtimeout: 5000 , w:1}, function(err, result) {
    if (err) {
      console.log(err);
    }
    console.log("insert phrases: ", result.result);
    if (callback)
      callback();
  });
};


if ( typeof module !== "undefined" ) {
  exports.PlayDB = PlayDB;
}