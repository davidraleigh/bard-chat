/**
 * Created by davidraleigh on 5/21/15.
 */
var ObjectID = require('mongodb').ObjectID;

var PlayDB = function() {
};

PlayDB.savePlay = function(db, playDetails, callback) {
  //MongoClient.connect(url, function(err, db) {
  //  assert.equal(null, err);
  //  console.log("Connected correctly to server");
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
  //});
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


//var method_name = "Colours";
//var method_prefix = "populate_";
//
//// Call function:
//window[method_prefix + method_name](arg1, arg2);
PlayDB.insertGeneric = function(db, collection, scene, methodName, playTitle, actNumber, callback) {
  var filterObject = {'playTitle' : playTitle};
  var sceneNumber = scene.getSceneNumber();
  var batches = [];
  batches.push([]);

  scene.getDialogs().forEach(function(dialog) {
    var speaker = dialog.getCharacter();
    dialog[methodName](true).forEach(function(insertObject) {
      if (methodName === '') {
        filterObject['lineNumber'] = insertObject.lineNumber;
      }

      // TODO should all this be moved into Dialog class?
      insertObject['actNumber'] = actNumber;
      insertObject['sceneNumber'] = sceneNumber;
      insertObject['playTitle'] = playTitle;
      insertObject['speaker'] = speaker;
      insertObject['random'] = Math.random();
      insertObject['_id'] = new ObjectID();
      if (batches[batches.length - 1].length >= 1000) {
        batches.push([]);
      }
      batches[batches.length - 1].push(insertObject);
    });
  });

  PlayDB.insertBatches(db, collection, batches, 0, callback);
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

PlayDB.insertSceneLines = function(db, playDetails, scene, actNumber, callback) {
  var playTitle = playDetails.getTitle();
  var linesCollection = db.collection('lines');
  PlayDB.insertGeneric(db, linesCollection, scene, 'getLines', playTitle, actNumber, callback);
};

PlayDB.insertSceneSentences = function(db, playDetails, scene, actNumber, callback) {
  var playTitle = playDetails.getTitle();
  var sentencesCollection = db.collection('sentences');
  PlayDB.insertGeneric(db, sentencesCollection, scene, 'getSentences', playTitle, actNumber, callback);
};

PlayDB.insertEndStopped = function(db, playDetails, scene, actNumber, callback) {
  var playTitle = playDetails.getTitle();
  var endStoppedCollection = db.collection('endStopped');
  PlayDB.insertGeneric(db, endStoppedCollection, scene, 'getEndStopped', playTitle, actNumber, callback);
};

PlayDB.insertPhrases = function(db, playDetails, scene, actNumber, callback) {
  var playTitle = playDetails.getTitle();
  var phrasesCollection = db.collection('phrases');
  PlayDB.insertGeneric(db, phrasesCollection, scene, 'getPhrases', playTitle, actNumber, callback);
};


if ( typeof module !== "undefined" ) {
  exports.PlayDB = PlayDB;
}