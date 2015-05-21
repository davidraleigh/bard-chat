/**
 * Created by davidraleigh on 5/20/15.
 */

var ParseUtils = require('./parseUtils.js').ParseUtils;

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
  this.sentences = ParseUtils.linesToSentences(this.lines);
};

Dialog.prototype.getSentences = function() {
  return this.sentences.slice();
};


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


var PlayDetails = function(html) {
  this.title = "";
  // hash map of act number keys and scene object arrays
  // this.acts = {1: [sceneObj1, sceneObj2], 2: [sceneObj1]};
  this.fullHTML = html || "";
  this.acts = {};
  this.characterSet = [];
  this.characterMap = {};
  this.locationSet = [];
  this.locationMap = {};
};

PlayDetails.prototype.setFullHTML = function(html) {
  this.fullHTML = html;
}

PlayDetails.prototype.setTitle = function(title) {
  this.title = title;
}

PlayDetails.prototype.getTitle = function() {
  return this.title;
}

PlayDetails.prototype.addScene = function(actNumber, scene) {
  if (this.acts[actNumber]  === undefined)
    this.acts[actNumber] = [];
  this.acts[actNumber].push(scene);
};

function sortByWordCount(a, b) {
  var diff = b.split(' ').length - a.split(' ').length;
  if (diff !== 0)
    return diff;
  else if (b > a)
    return -1;
  return 1;
};

PlayDetails.prototype.addCharacter = function(name) {
  if (this.hasCharacter(name))
    return;
  this.characterMap[name] = true;
  this.characterSet.push(name);
};

PlayDetails.prototype.hasCharacter = function(name) {
  if (name in this.characterMap)
    return true;
  return false;
}

PlayDetails.prototype.getCharacters = function() {
  // return names by order of most complex. complex being the name with the most words
  return this.characterSet.sort(sortByWordCount);
};

PlayDetails.prototype.addLocation = function(location) {
  // if there is an all capital word, then ignore this
  ///^([a-z0-9]{5,})$/.test('abc1');
  if (/[A-Z]{2,}/g.test(location))
    return;

  // split by space and take the last word if it is capitalized
  var group = location.split(' ');
  var lastWord = group[group.length - 1];
  if (/^([^A-Z][a-z]+)/g.test(lastWord))
    return;

  if (group.length > 2) {
    return;
  }

  if (this.hasLocation(location))
    return;

  this.locationMap[location] = true;
  this.locationSet.push(location);
};

PlayDetails.prototype.hasLocation = function(location) {
  if (location in this.locationMap)
    return true;
  return false;
}

PlayDetails.prototype.getLocations = function() {
  return this.locationSet.sort(sortByWordCount);
}

if ( typeof module !== "undefined" ) {
  exports.PlayDetails = PlayDetails;
  exports.Scene = Scene;
  exports.Dialog = Dialog;
}