/**
 * Created by davidraleigh on 5/21/15.
 */
var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var ObjectID = require('mongodb').ObjectID;

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
      console.log('deleted play overview for :', playDetails.getTitle());
      if (err) {
        callback(err);
        return;
      }
      PlayDB.savePlayOverview(db, playDetails, function(err) {
        if (err) {
          callback(err);
          return;
        }
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
    if (err) {
      callback(err);
      return;
    }
    console.log("Inserted play overview", result.result);
    callback();
  });
};

PlayDB.saveScenes = function(db, playDetails, callback) {
  var sentencesCollection = db.collection('sentences');
  var linesCollection = db.collection('lines');
  var endStoppedCollection = db.collection('endStopped');
  var phrasesCollection = db.collection('phrases');
  sentencesCollection.deleteMany({'playTitle' : playDetails.getTitle()}, function(err) {
    if (err) {
      callback(err);
      return;
    }
    console.log('deleted play sentences for :', playDetails.getTitle());
    linesCollection.deleteMany({'playTitle' : playDetails.getTitle()}, function(err) {
      if (err) {
        callback(err);
        return;
      }
      console.log('deleted play lines for :', playDetails.getTitle());
      endStoppedCollection.deleteMany({'playTitle' : playDetails.getTitle()}, function(err) {
        if (err) {
          callback(err);
          return;
        }
        console.log('deleted play endStopped for :', playDetails.getTitle());
        phrasesCollection.deleteMany({'playTitle' : playDetails.getTitle()}, function (err) {
          if (err) {
            callback(err);
            return;
          }
          console.log('deleted play phrases for :', playDetails.getTitle());
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
  PlayDB.insertSceneSentences(db, playDetails, scene, actNumber, function(err) {
    if (err) {
      callback(err);
      return;
    }
    PlayDB.insertSceneLines(db, playDetails, scene, actNumber, function(err) {
      if (err) {
        callback(err);
        return;
      }
      PlayDB.insertEndStopped(db, playDetails, scene, actNumber, function(err) {
        if (err) {
          callback(err);
          return;
        }
        PlayDB.insertPhrases(db, playDetails, scene, actNumber, function (err) {
          if (err) {
            callback(err);
            return;
          }
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
  var batches = [];
  batches.push([]);

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
      if (batches[batches.length - 1].length >= 1000) {
        batches.push([]);
      }
      batches[batches.length - 1].push(upsertLineObject);
    });
  });


  var linesCollection = db.collection('lines');
  PlayDB.insertBatches(db, linesCollection, batches, 0, callback);
};

PlayDB.insertSceneSentences = function(db, playDetails, scene, actNumber, callback) {
  var play = playDetails.getTitle();
  //var filterObject = {'playTitle' : playDetails.getTitle()};
  var sceneNumber = scene.getSceneNumber();
  var batches = [];
  batches.push([]);

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
      if (batches[batches.length - 1].length >= 1000) {
        batches.push([]);
      }
      batches[batches.length - 1].push(upsertSentenceObject);
    });
  });

  var sentencesCollection = db.collection('sentences');
  PlayDB.insertBatches(db, sentencesCollection, batches, 0, callback);
};

PlayDB.insertEndStopped = function(db, playDetails, scene, actNumber, callback) {
  var play = playDetails.getTitle();
  //var filterObject = {'playTitle' : playDetails.getTitle()};
  var sceneNumber = scene.getSceneNumber();
  var batches = [];
  batches.push([]);

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
      if (batches[batches.length - 1].length >= 1000) {
        batches.push([]);
      }
      batches[batches.length - 1].push(upsertEndStoppedObject);
    });
  });

  var endStoppedCollection = db.collection('endStopped');
  PlayDB.insertBatches(db, endStoppedCollection, batches, 0, callback);
};

PlayDB.insertBatches = function(db, collection, batchesArray, batchIndex, callback) {
  if (batchIndex >= batchesArray.length) {
    callback();
    return;
  }
  collection.insertMany(batchesArray[batchIndex], {wtimeout:5000, w:1}, function(err, result) {
    if (err) {
      callback(err);
      return;
    }
    console.log("insert result : ", result.result);
    PlayDB.insertBatches(db, collection, batchesArray, batchIndex + 1, callback);
  });
};

PlayDB.insertPhrases = function(db, playDetails, scene, actNumber, callback) {
  var play = playDetails.getTitle();
  //var filterObject = {'playTitle' : playDetails.getTitle()};
  var sceneNumber = scene.getSceneNumber();
  var batches = [];
  batches.push([]);

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
      if (batches[batches.length - 1].length >= 1000) {
        batches.push([]);
      }
      batches[batches.length - 1].push(upsertPhrasesObject);
    });
  });

  var phrasesCollection = db.collection('phrases');
  PlayDB.insertBatches(db, phrasesCollection, batches, 0, callback);
};


if ( typeof module !== "undefined" ) {
  exports.PlayDB = PlayDB;
}