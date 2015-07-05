/**
 * Created by davidraleigh on 5/20/15.
 */

var ParseUtils = require('./parseUtils.js').ParseUtils;
var sentiment = require('sentiment');

var Set = function() {
  this.bResort = false;
  this.setArray = [];
  this.setMap = {};
};

Set.prototype.add = function(value) {
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      if (this.hasValue(value[i]))
        continue;

      this.setMap[value[i]] = true;
      this.setArray.push(value[i]);
      this.bResort = true;
    }

    return;
  }

  if (this.hasValue(value))
    return;

  this.setMap[value] = true;
  this.setArray.push(value);
  this.bResort = true;
};

Set.prototype.hasValue = function(value) {
  if (value in this.setMap)
    return true;
  return false;
};

// TODO probably good to just have a getArray call that grabs the reference instead of slicing.
Set.prototype.slice = function() {
  return this.setArray.slice();
};

Set.prototype.sort = function(comparator) {
  if (this.bResort) {
    this.bResort = false;
    return this.setArray.sort(comparator);
  }

  return this.setArray;
};

Set.prototype.size = function() {
  return this.setArray.length;
};

Set.prototype.forEach = function(callback) {
  this.setArray.forEach(callback);
};



var Dialog = function(speaker, type) {
  this.character = ParseUtils.allCapsToCapitalized(speaker);
  this.lines = [];
  this.sentences = [];
  this.endStopped = [];
  this.phrases = [];

  this.people = new Set();
  this.locations= new Set();
  this.otherNouns = new Set();

  this.type = type || 'dialog'; // prologue || epilogue

  // TODO maybe remove all the linked list stuff
  var prev = null;
  var next = null;
};

Dialog.prototype.isPrologue = function() {
  return this.type === 'prologue';
};

Dialog.prototype.isEpilogue = function() {
  return this.type === 'epilogue';
};

//Dialog.prototype.getLineCount = function(){
//  return this.lines.length;
//};

Dialog.prototype.addLine = function(lineText, lineNumber, people, locations, otherNouns) {
  this.lines.push(
    {
      'text' : lineText,
      'textType' : 'lineType',
      'lineNumber' : lineNumber,
      'people' : people || [],
      'locations' : locations || [],
      'otherNouns' : otherNouns || []
    });

  // this.people.add(people);
  this.people.add(people);
  this.locations.add(locations);
  this.otherNouns.add(otherNouns);
};

Dialog.prototype.getCharacter = function() {
  return this.character;
};

Dialog.prototype.addText = function(text, textType, people, locations, otherNouns, dialogBlockStart, dialogBlockEnd) {
  var communicationType = 'unknown';
  if (text[text.length - 1] === '?')
    communicationType = 'question';
  else if (text[text.length - 1] === '!')
    communicationType = 'exclamation';
  else if (text.indexOf("No") === 0)
    communicationType = 'negation';
  else if (text.indexOf('Yes') === 0)
    communicationType = 'affirmation';
  else if (text.indexOf('But') === 0)
    communicationType = 'excuse';

  var sentimentAnalysis = sentiment(text);
  var textObj = {
    'text' : text,
    'textType' : textType,//'sentenceType',
    'wordCount' : text.split(/\S+/g).length,
    'sentimentScore' : sentimentAnalysis.score,
    'sentimentComparative' : sentimentAnalysis.comparative,
    'sentimentPositiveWords' : sentimentAnalysis.positive,
    'sentimentNegativeWords' : sentimentAnalysis.negative,
    'dialogBlockStart' : dialogBlockStart,
    'dialogBlockEnd' : dialogBlockEnd,
    'ICount' : ParseUtils.getWordOccurrence(text, ' I ', false),
    'youCount' : ParseUtils.getWordOccurrence(text.toLowerCase(), ' you ', false),
    'heCount' : ParseUtils.getWordOccurrence(text.toLowerCase(), ' he ', false),
    'sheCount' : ParseUtils.getWordOccurrence(text.toLowerCase(), ' she ', false),
    'theyCount' : ParseUtils.getWordOccurrence(text.toLowerCase(), ' they ', false),
    'weCount' : ParseUtils.getWordOccurrence(text.toLowerCase(), ' we ', false),
    'people' : people || [],
    'locations' : locations || [],
    'otherNouns' : otherNouns || [],
    'characterCount' : text.length,
    'communicationType' : communicationType
  };

  switch (textType){
    case 'sentenceType':
      this.sentences.push(textObj);
      break;
    case 'phraseType':
      this.phrases.push(textObj);
      break;
    case 'endStoppedType':
      this.endStopped.push(textObj);
      break;
  }

  return textObj;
};

Dialog.prototype.addSentence = function(sentenceText, people, locations, otherNouns, dialogBlockStart, dialogBlockEnd) {
  var communicationType = 'unknown';
  if (sentenceText[sentenceText.length - 1] === '?')
    communicationType = 'question';
  else if (sentenceText[sentenceText.length - 1] === '!')
    communicationType = 'exclamation';
  else if (sentenceText.indexOf("No") === 0)
    communicationType = 'negation';
  else if (sentenceText.indexOf('Yes') === 0)
    communicationType = 'affirmation';
  else if (sentenceText.indexOf('But') === 0)
    communicationType = 'excuse';

  var sentence = {
    'text' : sentenceText,
    'textType' : 'sentenceType',
    'dialogBlockStart' : dialogBlockStart,
    'dialogBlockEnd' : dialogBlockEnd,
    'ICount' : ParseUtils.getWordOccurrence(sentenceText, ' I ', false),
    'youCount' : ParseUtils.getWordOccurrence(sentenceText.toLowerCase(), ' you ', false),
    'heCount' : ParseUtils.getWordOccurrence(sentenceText.toLowerCase(), ' he ', false),
    'sheCount' : ParseUtils.getWordOccurrence(sentenceText.toLowerCase(), ' she ', false),
    'theyCount' : ParseUtils.getWordOccurrence(sentenceText.toLowerCase(), ' they ', false),
    'weCount' : ParseUtils.getWordOccurrence(sentenceText.toLowerCase(), ' we ', false),
    'people' : people || [],
    'locations' : locations || [],
    'otherNouns' : otherNouns || [],
    'characterCount' : sentenceText.length,
    'communicationType' : communicationType
  };
  this.sentences.push(sentence);
  return sentence;
};

Dialog.prototype.addEndStopped = function(endStoppedText, people, locations, otherNouns, dialogBlockStart, dialogBlockEnd) {
    var communicationType = 'unknown';
    if (endStoppedText[endStoppedText.length - 1] === '?')
      communicationType = 'question';
    else if (endStoppedText[endStoppedText.length - 1] === '!')
      communicationType = 'exclamation';
    else if (endStoppedText.indexOf("No") === 0)
      communicationType = 'negation';
    else if (endStoppedText.indexOf('Yes') === 0)
      communicationType = 'affirmation';
    else if (endStoppedText.indexOf('But') === 0)
      communicationType = 'excuse';

    this.endStopped.push(
      {
        'text' : endStoppedText,
        'textType' : 'endStoppedType',
        'dialogBlockStart' : dialogBlockStart,
        'dialogBlockEnd' : dialogBlockEnd,
        'ICount' : ParseUtils.getWordOccurrence(endStoppedText, ' I ', false),
        'youCount' : ParseUtils.getWordOccurrence(endStoppedText.toLowerCase(), ' you ', false),
        'heCount' : ParseUtils.getWordOccurrence(endStoppedText.toLowerCase(), ' he ', false),
        'sheCount' : ParseUtils.getWordOccurrence(endStoppedText.toLowerCase(), ' she ', false),
        'theyCount' : ParseUtils.getWordOccurrence(endStoppedText.toLowerCase(), ' they ', false),
        'weCount' : ParseUtils.getWordOccurrence(endStoppedText.toLowerCase(), ' we ', false),
        'people' : people || [],
        'locations' : locations || [],
        'otherNouns' : otherNouns || [],
        'characterCount' : endStoppedText.length,
        'communicationType' : communicationType
      });
};

Dialog.prototype.addPhrase = function(phraseText, people, locations, otherNouns, dialogBlockStart, dialogBlockEnd) {
  var communicationType = 'unknown';
  if (phraseText[phraseText.length - 1] === '?')
    communicationType = 'question';
  else if (phraseText[phraseText.length - 1] === '!')
    communicationType = 'exclamation';
  else if (phraseText.indexOf("No") === 0)
    communicationType = 'negation';
  else if (phraseText.indexOf('Yes') === 0)
    communicationType = 'affirmation';
  else if (phraseText.indexOf('But') === 0)
    communicationType = 'excuse';

  this.phrases.push(
    {
      'text' : phraseText,
      'textType' : 'phraseType',
      'dialogBlockStart' : dialogBlockStart,
      'dialogBlockEnd' : dialogBlockEnd,
      'ICount' : ParseUtils.getWordOccurrence(phraseText, ' I ', false),
      'youCount' : ParseUtils.getWordOccurrence(phraseText.toLowerCase(), ' you ', false),
      'heCount' : ParseUtils.getWordOccurrence(phraseText.toLowerCase(), ' he ', false),
      'sheCount' : ParseUtils.getWordOccurrence(phraseText.toLowerCase(), ' she ', false),
      'theyCount' : ParseUtils.getWordOccurrence(phraseText.toLowerCase(), ' they ', false),
      'weCount' : ParseUtils.getWordOccurrence(phraseText.toLowerCase(), ' we ', false),
      'people' : people || [],
      'locations' : locations || [],
      'otherNouns' : otherNouns || [],
      'characterCount' : phraseText.length,
      'communicationType' : communicationType
    });
};

Dialog.prototype.sentencesToEndStopped = function() {
  var boundEndStoppedAdd = Dialog.prototype.addText.bind(this);

  this.sentences.forEach(function(sentenceObj) {
    var endStoppedLines = ParseUtils.sentenceToEndStopped(sentenceObj.text);
    endStoppedLines.forEach(function(endStoppedText) {
      var endStoppedPeople = new Set();
      var endStoppedLocations = new Set();
      var endStoppedOtherNouns = new Set();

      sentenceObj.people.forEach(function(person) {
        if (endStoppedText.indexOf(person) !== -1) {
          endStoppedPeople.add(person);
        }
      });
      sentenceObj.locations.forEach(function(location){
        if (endStoppedText.indexOf(location) !== -1) {
          endStoppedLocations.add(location);
        }
      });
      sentenceObj.otherNouns.forEach(function(otherNoun) {
        if (endStoppedText.indexOf(otherNoun) !== -1) {
          endStoppedOtherNouns.add(otherNoun);
        }
      });

      // TODO, this is wrong, a end stopped will not have all the people of a sentence, but it will have a subset
      boundEndStoppedAdd(endStoppedText, 'endStoppedType', endStoppedPeople.slice(), endStoppedLocations.slice(), endStoppedOtherNouns.slice(), sentenceObj.dialogBlockStart, sentenceObj.dialogBlockEnd);
    });
  });
};

Dialog.prototype.sentencesToPhrases = function() {
  var boundPhraseAdd = Dialog.prototype.addText.bind(this);

  this.sentences.forEach(function(sentenceObj) {
    var phrases = ParseUtils.sentenceToCommaPhrase(sentenceObj.text);
    phrases.forEach(function(phraseText) {
      var phrasePeople = new Set();
      var phraseLocations = new Set();
      var phraseOtherNouns = new Set();

      sentenceObj.people.forEach(function(person) {
        if (phraseText.indexOf(person) !== -1) {
          phrasePeople.add(person);
        }
      });
      sentenceObj.locations.forEach(function(location){
        if (phraseText.indexOf(location) !== -1) {
          phraseLocations.add(location);
        }
      });
      sentenceObj.otherNouns.forEach(function(otherNoun) {
        if (phraseText.indexOf(otherNoun) !== -1) {
          phraseOtherNouns.add(otherNoun);
        }
      });

      // TODO, this is wrong, a phrase will not have all the people of a sentence, but it will have a subset
      boundPhraseAdd(phraseText, 'phraseType', phrasePeople.slice(), phraseLocations.slice(), phraseOtherNouns.slice(), sentenceObj.dialogBlockStart, sentenceObj.dialogBlockEnd);
    });
  });
};

Dialog.prototype.linesToSentences = function(properNouns) {
  var lines = this.getLines(true);

  var sentences = ParseUtils.linesToSentences(this.getLines(), properNouns);
  // TODO this makes me so sad. Better to fold this into linesToSentences, but for now the hack lives
  for (var i = 0; i < sentences.length; i++) {
    var sentenceText = sentences[i];
    var sentencePeople = new Set();
    var sentenceLocations = new Set();
    var sentenceOtherNouns = new Set();
    this.people.forEach(function(person) {
      if (sentenceText.indexOf(person) !== -1) {
        sentencePeople.add(person);
      }
    });
    this.locations.forEach(function(location) {
      if (sentenceText.indexOf(location) !== -1) {
        sentenceLocations.add(location);
      }
    });
    this.otherNouns.forEach(function(otherNoun) {
      if (sentenceText.indexOf(otherNoun) !== -1) {
        sentenceOtherNouns.add(otherNoun);
      }
    });

    this.addText(
      sentenceText,
      'sentenceType',
      sentencePeople.slice(),
      sentenceLocations.slice(),
      sentenceOtherNouns.slice(),
      lines[0].lineNumber,
      lines[lines.length - 1].lineNumber);
  }
};

Dialog.prototype.createLineDerivatives = function(properNouns) {
  this.linesToSentences(properNouns);
  this.sentencesToEndStopped();
  this.sentencesToPhrases();
};

Dialog.prototype.getSentences = function(bWithDetails) {
  if (bWithDetails)
    return this.sentences;

  return this.sentences.map(function(sentence) { return sentence.text; });
};

Dialog.prototype.getLines = function(bWithDetails) {
  if (bWithDetails)
    return this.lines;

  return this.lines.map(function(line) { return line.text; });
};

Dialog.prototype.getEndStopped = function(bWithDetails) {
  if (bWithDetails)
    return this.endStopped;

  return this.endStopped.map(function(endStoppedLine) { return endStoppedLine.text; });
};

Dialog.prototype.getPhrases = function(bWithDetails) {
  if (bWithDetails)
    return this.phrases;

  return this.phrases.map(function(phrase) { return phrase.text; });
};

Dialog.prototype.toString = function() {
  var result = "";
  result += this.getCharacter() + ', Lines: \t\n';
  this.getLines().forEach(function(line) {
    result += line + '\n';
  });

  result += '\n';
  result += this.getCharacter() + ', Sentences: \t\n';
  this.getSentences().forEach(function(element) {
    result += element + '\n';
  });

  result += '\n';
  result += this.getCharacter() + ', End Stopped: \t\n';
  this.getEndStopped().forEach(function(element) {
    result += element + '\n';
  });

  result += '\n';
  result += this.getCharacter() + ', Phrases: \t\n';
  this.getPhrases().forEach(function(element) {
    result += element + '\n';
  });
  return result;
};


var Scene = function(sceneNumber, location) {
  this.dialogs = [];
  this.lineCount = 0;
  this.sceneNumber = sceneNumber;
  this.location = location;

  // TODO perhaps remove all this linked list stuff
  this.firstDialog = null;
  this.lastDialog = null;
};

Scene.prototype.toString = function() {
  var result = "";
  result += this.sceneNumber + ' ' + this.location;
  this.dialogs.forEach(function(dialog) {
    result += '\n';
    result += dialog.toString();
    result += '\n';
  });

  return result;
};

Scene.prototype.getDialogs = function() {
  return this.dialogs;
};

Scene.prototype.addDialogue = function(dialog, properNouns) {
  this.lineCount += dialog.lines.length;
  dialog.createLineDerivatives(properNouns);
  this.dialogs.push(dialog);

  // TODO perhaps remove all this linked list stuff
  if (this.firstDialog === null) {
    this.firstDialog = dialog;
    this.lastDialog = dialog;
  } else {
    dialog.prev = this.lastDialog;
    this.lastDialog.next = dialog;
    this.lastDialog = dialog;
  }
};

//Scene.prototype.getLineCount = function() {
//  return this.lineCount;
//};

Scene.prototype.getSceneNumber = function() {
  return this.sceneNumber;
};


var PlayDetails = function(html) {
  this.title = "";
  // hash map of act number keys and scene object arrays
  // this.acts = {1: [sceneObj1, sceneObj2], 2: [sceneObj1]};
  this.fullHTML = html || "";
  this.acts = {};

  // Should replace with Set
  this.characterSet = new Set();
  //this.characterMap = {};
  this.locationSet = new Set();
  //this.locationMap = {};
  this.otherProperNounSet = new Set();
  //this.otherProperNounMap = {};
  this.allProperNounsSet = new Set();
  // Should replace with Set

  this.prologue = {};
  this.epilogue = {};
  this.isPlayComplete = false;
};

PlayDetails.prototype.setPlayAsComplete = function() {
  this.isPlayComplete = true;
};

PlayDetails.prototype.addPrologue = function(dialog, properNouns) {
  dialog.createLineDerivatives(properNouns);
  this.prologue = dialog;
};

PlayDetails.prototype.getPrologue = function() {
  return this.prologue;
};

PlayDetails.prototype.addEpilogue = function(dialog, properNouns) {
  dialog.createLineDerivatives(properNouns);
  this.epilogue = dialog;
};

PlayDetails.prototype.getEpilogue = function() {
  return this.epilogue;
};

PlayDetails.prototype.getActNumbers = function() {
  function sortNumber(a,b) {
    return parseInt(a) - parseInt(b);
  }

  return Object.keys(this.acts).sort(sortNumber);
};

PlayDetails.prototype.getScenes = function(actNumber) {
  if (actNumber in this.acts) {
    return this.acts[actNumber];
  }
  return null;
};

PlayDetails.prototype.getScene = function(actNumber, sceneNumber) {
  if (!this.hasScene(actNumber, sceneNumber)) {
    return null;
  }

  var result = null;
  this.acts[actNumber].forEach(function(scene) {
    if (scene.getSceneNumber() === sceneNumber) {
      result = scene;
      return;
    }
  });

  return result;
}

PlayDetails.prototype.hasAct = function(actNumber) {
  if (actNumber in this.acts) {
    return true;
  }
  return false;
};

PlayDetails.prototype.hasScene = function(actNumber, sceneNumber) {
  if (!this.hasAct(actNumber))
    return false;

  var bHasScene = false;
  this.acts[actNumber].forEach(function(scene) {
    if (scene.getSceneNumber() === sceneNumber) {
      bHasScene = true;
      return;
    }
  });

  return bHasScene;
};


PlayDetails.prototype.setFullHTML = function(html) {
  this.fullHTML = html;
};

PlayDetails.prototype.getFullHTML = function() {
  return this.fullHTML;
};

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

PlayDetails.prototype.addOtherProperNoun = function(noun) {
  // TODO this "And" is totally not a solution!!!
  if (this.characterSet.hasValue(noun) || this.locationSet.hasValue(noun) || noun === "And")
    return;

  this.otherProperNounSet.add(noun);
  this.allProperNounsSet.add(noun);
};

PlayDetails.prototype.getOtherProperNouns = function() {
  return this.otherProperNounSet.sort(sortByWordCount);
};

// TODO maybe this should be a set that is maintained along with locationSet, characterSet, and otherPronounSet?
PlayDetails.prototype.getAllProperNouns = function() {
  return this.allProperNounsSet.sort(sortByWordCount);
  //var allProperNouns = this.otherProperNounSet.slice();
  //allProperNouns = allProperNouns.concat(this.locationSet.slice());
  //allProperNouns = allProperNouns.concat(this.characterSet.slice());
  //return allProperNouns.sort(sortByWordCount);
};

PlayDetails.prototype.addCharacter = function(name) {
  // if noun is all capitalized
  name = ParseUtils.allCapsToCapitalized(name);

  if (name === 'No' || name === 'You' || name === 'The' || name === 'How')
    console.log('WTF');
  this.characterSet.add(name);
  this.allProperNounsSet.add(name);
};

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

  this.locationSet.add(location);
  this.allProperNounsSet.add(location);
};

PlayDetails.prototype.getLocations = function() {
  return this.locationSet.sort(sortByWordCount);
};

if ( typeof module !== "undefined" ) {
  exports.PlayDetails = PlayDetails;
  exports.Scene = Scene;
  exports.Dialog = Dialog;
  // TODO this is only exported for testing purposes.
  exports.Set = Set;
}
