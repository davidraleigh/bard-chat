var path = require('path');
var assert = require('assert');

console.log(path.join(__dirname, '..', './bardParse.js'));
var module = require(path.join(__dirname, '..', './bardParse.js'));
var ParseUtils = require(path.join(__dirname, '..', './parseUtils.js')).ParseUtils;
var PlayDetails = require(path.join(__dirname, '..', './playComponents.js')).PlayDetails;
var Set = require(path.join(__dirname, '..', './playComponents.js')).Set;

describe('bardParse()', function () {
  'use strict';

  it('does something', function () {
    module.BardParse.parseFromHTMLFile('../full.html');
  });

  it('test one sentence one line', function () {
    var dialog = new module.Dialog();
    var line1 = "Words words.";
    dialog.addLine(line1);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal(line1, sentences[0]);
  });

  it('test one sentence two lines', function () {
    var dialog = new module.Dialog();
    var line1 = "Words words";
    var line2 = "TWords words.";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal("Words words tWords words.", sentences[0]);
  });

  it('test one sentence three lines with proper noun', function () {
    var lines = [];
    lines.push("Words words");
    lines.push("TWords words");
    lines.push("Ords words.");
    var sentences = ParseUtils.linesToSentences(lines, ["TWords"]);
    assert.equal(sentences[0], "Words words TWords words ords words.");
  });

  it('test one sentence two lines with proper noun', function () {
    var lines = [];
    lines.push("Words words");
    lines.push("TWords words.");
    var sentences = ParseUtils.linesToSentences(lines, ["TWords"]);
    assert.equal(sentences[0], "Words words TWords words.");
  });

  it('test two sentence two lines with quotes, period and apostrophe', function () {
    var dialog = new module.Dialog();
    var line1 = "Words words, 'Wah smack.' Our";
    var line2 = "TWords word's.";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal("Words words, 'Wah smack.'", sentences[0]);
    assert.equal("Our tWords word's.", sentences[1]);
  });

  it('test two sentence two lines with quotes, exclamation and apostrophe', function () {
    var dialog = new module.Dialog();
    var line1 = "Words words, 'Wah smack!' Our";
    var line2 = "TWords word's.";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal("Words words, 'Wah smack!'", sentences[0]);
    assert.equal("Our tWords word's.", sentences[1]);
  });

  it('test two sentence two lines with quotes, question mark and apostrophe', function () {
    var dialog = new module.Dialog();
    var line1 = "Words words, 'Wah smack?' Our";
    var line2 = "TWords word's.";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal("Words words, 'Wah smack?'", sentences[0]);
    assert.equal("Our tWords word's.", sentences[1]);
  });


  it('test two sentence two lines with quotes, question marks, exclamations and apostrophe', function () {
    var dialog = new module.Dialog();
    var line1 = "Words words, 'Wah smack!?!?' Our";
    var line2 = "TWords word's.";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal("Words words, 'Wah smack!?!?'", sentences[0]);
    assert.equal("Our tWords word's.", sentences[1]);
  });

  it('test messy sentence for apostrophes', function() {
    var lines = [];
    lines.push("He Cannot Gerard de Vabon want the Count Banal Lord Camel Captain Best. asdfasdf. Appl! Snape");
    lines.push("says,");
    lines.push("'If there was only a life.' Our");
    lines.push("Banana kindom. Animal's");
    lines.push("Monkey monkey");
    lines.push("Pwehew.");
    lines.push("  Bard");
    lines.push("says, 'Banana banana banana.' Apple Apple.");
    var dialog = new module.Dialog();
    lines.forEach(function(element) {
      dialog.addLine(element);
    });
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal(sentences[0], "He Cannot Gerard de Vabon want the Count Banal Lord Camel Captain Best.");
    assert.equal(sentences[1], 'Asdfasdf.');
    assert.equal(sentences[2], 'Appl!');
    assert.equal(sentences[3], "Snape says, 'If there was only a life.'");
    assert.equal(sentences[4], "Our banana kindom.");
    assert.equal(sentences[5], "Animal's monkey monkey pwehew.");
    assert.equal(sentences[6], "Bard says, 'Banana banana banana.'");
    assert.equal(sentences[7], "Apple Apple.");
  });


  it('test two sentences two lines', function () {
    var dialog = new module.Dialog();
    var line1 = "Words. Words";
    var line2 = "TWords words.";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal("Words tWords words.", sentences[1]);
    assert.equal("Words.", sentences[0]);
  });

  it('test 3 sentences two lines', function () {
    var dialog = new module.Dialog();
    var line1 = "Words. Words2! Words3,";
    var line2 = "TWords words.";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal("Words.", sentences[0]);
    assert.equal("Words2!", sentences[1]);
    assert.equal("Words3, tWords words.", sentences[2]);
  });

  it('test 5 sentences 5 lines', function () {
    var dialog = new module.Dialog();
    var line1 = "Words. Words2! Words3,";
    var line2 = "TWords words3";
    var line3 = "TWords3? Words4";
    var line4 = "Words4 words4 words4";
    var line5 = "Words4. Words5 words5";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.addLine(line3);
    dialog.addLine(line4);
    dialog.addLine(line5);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal("Words.", sentences[0]);
    assert.equal("Words2!", sentences[1]);
    assert.equal("Words3, tWords words3 tWords3?", sentences[2]);
    assert.equal("Words4 words4 words4 words4 words4.", sentences[3]);
    assert.equal("Words5 words5", sentences[4]);
  });

  it('test 2 sentences 5 lines', function () {
    var dialog = new module.Dialog();
    var line1 = "Words Words Words";
    var line2 = "Words Words Words";
    var line3 = "Words Words Words";
    var line4 = "Words. Words2 words2";
    var line5 = "Words2 Words2 Words2.";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.addLine(line3);
    dialog.addLine(line4);
    dialog.addLine(line5);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    assert.equal("Words Words Words words Words Words words Words Words words.", sentences[0]);
    assert.equal("Words2 words2 words2 Words2 Words2.", sentences[1]);
  });
  // Add more assertions here

  it ('regex test', function () {
    var text = "An Animal";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
  });

  it ('regex test multiple spaces', function () {
    var text = "An   Animal";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
  });

  it('test title starting points', function() {
    var text = 'Title of Bard is a good one. King Big of Denny is screwed. But de Should work.';
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Title of Bard");
    assert.equal(results[1], "Big of Denny");
    assert.equal(results[2], "But de Should");
    assert.equal(results.length, 3);
  })

  it ('regex test 2 sentences', function () {
    var text = "An Animal is not Bland. Andrew Is Also not Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is Also");
    assert.equal(results[3], "Stupid");
    assert.equal(results.length, 4);
  });


  it ('regex test lots of words', function () {
    var text = "An Animal is not Bland! Andrew Is Also not Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is Also");
    assert.equal(results[3], "Stupid");
  });

  it ('regex test with double spaces and lots of ??!!', function () {
    var text = "An Animal is not Bland!!? Andrew Is.   Also not Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Stupid");
  });

  it ('regex test with period and newline', function () {
    var text = "An Animal is not Bland!!? Andrew Is.\nAlso not Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Stupid");
  });


  it ('regex test with new line', function () {
    var text = "An Animal is not Bland! Andrew Is\nAlso not Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is\nAlso");
    assert.equal(results[3], "Stupid");
  });

  it ('regex test with I', function () {
    var bardParse = new module.BardParse();
    var text = "An Animal is not I Bland! Andrew Is\nAlso not Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is\nAlso");
    assert.equal(results[3], "Stupid");
  });

  it ('regex test with double spaces and lots of ??!! and a tab separation', function () {
    var text = "An Animal is not Bland!!? Andrew    Is\tAlso    not     Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is\tAlso");
    assert.equal(results[3], "Stupid");
  });

  //[To HELENA]  The best wishes that can be forged in
  it ('regex test with a bracket', function () {
    var text = "[To HELENA]  An Animal is not Bland!!? Andrew    Is\tAlso    not     Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Helena");
    assert.equal(results[1], "Animal");
    assert.equal(results[2], "Bland");
    assert.equal(results[3], "Is\tAlso");
    assert.equal(results[4], "Stupid");
  });

  //[To HELENA]  The best wishes that can be forged in
  it ('regex test with a bracket and two word', function () {
    var text = "[To KING LEROY]  An Animal is not Bland!!? Andrew    Is\tAlso    not     Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "King Leroy");
    assert.equal(results[1], "Animal");
    assert.equal(results[2], "Bland");
    assert.equal(results[3], "Is\tAlso");
    assert.equal(results[4], "Stupid");
  });

  it ('regex test with a bracket and multiple Leroys', function () {
    var text = "[To KING LEROY]  King Leroy is not King Leroy !!? Andrew    Is\tAlso   bandicoot of King Leroy  or King Leroy  not     Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "King Leroy");
    assert.equal(results[1], "Leroy");
    assert.equal(results[2], "King Leroy");
    assert.equal(results[3], "Is\tAlso");
    assert.equal(results[4], "King Leroy");
    assert.equal(results[5], "King Leroy");
    assert.equal(results[6], "Stupid");
  });

  it ('regex test with a bracket and two proper noun words in the bracket', function () {
    var text = "[Tall HELENA Whispers to KING LEROY Sweet nothings]  King Leroy is not King Leroy !!? Andrew    Is\tAlso   bandicoot of King Leroy  or King Leroy  not     Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Helena");
    assert.equal(results[1], "King Leroy");
    assert.equal(results[2], "Leroy");
    assert.equal(results[3], "King Leroy");
    assert.equal(results[4], "Is\tAlso");
    assert.equal(results[5], "King Leroy");
    assert.equal(results[6], "King Leroy");
    assert.equal(results[7], "Stupid");
  });

  it ('regex test with a bracket and one proper noun word in bracket ', function () {
    var text = "[KING LEROY To ]  An Animal is not Bland!!? Andrew    Is\tAlso    not     Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "King Leroy");
    assert.equal(results[1], "Animal");
    assert.equal(results[2], "Bland");
    assert.equal(results[3], "Is\tAlso");
    assert.equal(results[4], "Stupid");
  });

  //
  it ('regex test with a comma and a 2 word propernoun', function () {
    var text = "To God of heaven, King Richard and to me;";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "God");
    assert.equal(results[1], "King Richard");
  });

  it ('regex test with a tab', function () {
    var text = "  An Animal is not Bland!!? Andrew    Is\tAlso    not     Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is\tAlso");
    assert.equal(results[3], "Stupid");
  });

  // Gerard de Vabon
  it ('regex test with [Aside to', function() {
    var text = '[Aside to GREGORY] Is the law of our side, if I say ay?';
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results.length, 1);
    assert.equal(results[0], "Gregory");
  });


  //I Steven Sidler
  // Gerard de Vabon
  it ('regex test with I followed by 2 pronouns', function() {
    var text = 'Is the law Bartleby of Dublin our side, if I Steven Sidler say ay?';
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results.length, 2);
    assert.equal(results[0], "Bartleby of Dublin");
    assert.equal(results[1], "Steven Sidler");
  });

  it ('regex test with a Gerard de Vabon', function () {
    var text = "  An Gerard de Vabon is not Bland!!? Andrew    Is\tAlso    not     Paul de Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Gerard de Vabon");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is\tAlso");
    assert.equal(results[3], "Paul de Stupid");
  });

  it ('regex test with a Paul of Stupid', function () {
    var text = "  An Gerard de Vabon is not Bland!!? Andrew    Is\tAlso    not     Paul of Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Gerard de Vabon");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is\tAlso");
    assert.equal(results[3], "Paul of Stupid");
  });

  it ('regex test with a Paul of Stupid', function () {
    var text = "  An Captain Vabon is not King Bland!!? Andrew    Is\tAlso    not     Paul of Stupid.";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results[0], "Captain Vabon");
    assert.equal(results[1], "King Bland");
    assert.equal(results[2], "Is\tAlso");
    assert.equal(results[3], "Paul of Stupid");
  });


  it ('regex ." sentence completion', function() {
    var text = "Crying, 'That's good that's gone.' Our rash faults";
    var results = ParseUtils.extractProperNouns(text);
    assert.equal(results.length, 0);
  });

  it ('PlayDetails get character test', function() {
    var playDetails = new PlayDetails("test");
    playDetails.addCharacter("Bob");
    assert.equal(playDetails.getCharacters()[0], "Bob");
    assert.equal(playDetails.getCharacters().length, 1);
    playDetails.addCharacter("Count Bob");
    assert.equal(playDetails.getCharacters()[1], "Bob");
    assert.equal(playDetails.getCharacters()[0], "Count Bob");
    assert.equal(playDetails.getCharacters().length, 2);
    playDetails.addCharacter("Count of Bob");
    assert.equal(playDetails.getCharacters()[2], "Bob");
    assert.equal(playDetails.getCharacters()[1], "Count Bob");
    assert.equal(playDetails.getCharacters()[0], "Count of Bob");
    assert.equal(playDetails.getCharacters().length, 3);
    playDetails.addCharacter("Tount of Bob");
    assert.equal(playDetails.getCharacters()[3], "Bob");
    assert.equal(playDetails.getCharacters()[2], "Count Bob");
    assert.equal(playDetails.getCharacters()[0], "Count of Bob");
    assert.equal(playDetails.getCharacters()[1], "Tount of Bob");
    assert.equal(playDetails.getCharacters().length, 4);
    playDetails.addCharacter("Tount of Bob");
    assert.equal(playDetails.getCharacters().length, 4);
    playDetails.addCharacter("Tount of BOB");
    assert.equal(playDetails.getCharacters().length, 4);
    playDetails.addCharacter("DUKE OF EARL");
    assert.equal(playDetails.getCharacters().length, 5);
    assert.equal(playDetails.getCharacters()[1], "Duke of Earl");
    playDetails.addCharacter("KING HENRY VIII");
    assert.equal(playDetails.getCharacters().length, 6);
    assert.equal(playDetails.getCharacters()[2], "King Henry VIII");
  });

  it ('PlayDetails get character test', function() {
    var playDetails = new PlayDetails("test");
    playDetails.addLocation("The DUKE OF LANCASTER'S palace");
    playDetails.addLocation("The DUKE OF YORK's palace");
    playDetails.addLocation("The coast of Wales");
    playDetails.addLocation("The lists at Coventry");
    playDetails.addLocation("A camp in Wales");
    playDetails.addLocation("Wilds in Gloucestershire");
    playDetails.addLocation("A royal palace");
    playDetails.addLocation("The court");
    playDetails.addLocation("Pomfret castle");
    assert.equal(playDetails.getLocations().length, 0);
    playDetails.addLocation("Ely House");
    assert.equal(playDetails.getLocations().length, 1);
    assert.equal(playDetails.getLocations()[0], "Ely House");
    playDetails.addLocation("The same");
    playDetails.addLocation("The palace");
    assert.equal(playDetails.getLocations().length, 1);
    playDetails.addLocation("Westminster Hall");
    assert.equal(playDetails.getLocations().length, 2);
    assert.equal(playDetails.getLocations()[0], "Ely House");
    assert.equal(playDetails.getLocations()[1], "Westminster Hall");
    playDetails.addLocation("Windsor castle");
    playDetails.addLocation("LANGLEY");
    assert.equal(playDetails.getLocations().length, 2);
    playDetails.addLocation("Wales");
    assert.equal(playDetails.getLocations().length, 3);
    assert.equal(playDetails.getLocations()[0], "Ely House");
    assert.equal(playDetails.getLocations()[1], "Westminster Hall");
    assert.equal(playDetails.getLocations()[2], "Wales");
    playDetails.addLocation("Bristol");
    assert.equal(playDetails.getLocations().length, 4);
    assert.equal(playDetails.getLocations()[2], "Bristol");
    assert.equal(playDetails.getLocations()[3], "Wales");
    playDetails.addLocation("London");
    assert.equal(playDetails.getLocations().length, 5);
    assert.equal(playDetails.getLocations()[3], "London");
    assert.equal(playDetails.getLocations()[4], "Wales");
  });

  it('test end-stopped', function () {
    var results = ParseUtils.sentenceToEndStopped("We thank you both: yet one but flatters us, as well appeareth by the cause you come; namely, 'to appeal each other of high treason.'");
    assert.equal(results[0], "We thank you both");
    assert.equal(results[1], "Yet one but flatters us, as well appeareth by the cause you come");
    assert.equal(results[2], "Namely, 'to appeal each other of high treason.'");
  });

  it('test lines to sentences', function() {
    var lines = [];
    lines.push("How now! what means death in this rude assault?");
    lines.push("Villain, thy own hand yields thy death's instrument.");
    lines.push("Go thou, and fill another room in hell.");
    lines.push("That hand shall burn in never-quenching fire");
    lines.push("That staggers thus my person. Exton, thy fierce hand");
    lines.push("Hath with the king's blood stain'd the king's own land.");
    lines.push("Mount, mount, my soul! thy seat is up on high;");
    lines.push("Whilst my gross flesh sinks downward, here to die.");
    var sentences = ParseUtils.linesToSentences(lines);

    assert.equal(sentences[1], "What means death in this rude assault?");
    assert.equal(sentences[2], "Villain, thy own hand yields thy death's instrument.");
    //assert.equal(sentences[6], "Thy seat is up on high; whilst my gross flesh sinks downward, here to die.");
  });

  it ('test lines to sentences', function () {
    var lines = [];
    lines.push("I have been studying how I may compare");
    lines.push("This prison where I live unto the world:");
    lines.push("And for because the world is populous");
    lines.push("And here is not a creature but myself,");
    lines.push("I cannot do it; yet I'll hammer it out.");
    var sentences = ParseUtils.linesToSentences(lines);
    assert.equal(sentences[0], "I have been studying how I may compare this prison where I live unto the world: and for because the world is populous and here is not a creature but myself, i cannot do it; yet I'll hammer it out.");
  });

  it ('test Set creation', function() {
    var set = new Set();
    assert.equal(set.size(), 0);
  });

  it ('test adding value', function() {
    var set = new Set();
    set.add(1);
    assert.equal(set.size(), 1);
  });

  it ('test adding values', function() {
    var set = new Set();
    set.add(1);
    set.add(2);
    assert.equal(set.size(), 2);
  });

  it ('test retrieving values', function() {
    var set = new Set();
    set.add(1);
    set.add(2);
    var expected = [1, 2];
    assert.deepEqual(set.slice(), expected);
  });

  it ('test sorting 2 values', function() {
    var set = new Set();
    set.add(2);
    set.add(1);
    var expected = [2, 1];
    assert.deepEqual(set.sort(function (a, b) {
      return b - a;
    }), expected);
  });

  it ('test sorting mulctiple values', function() {
    var set = new Set();
    set.add(-1);
    set.add(2);
    set.add(5);
    set.add(1);
    var expected = [5, 2, 1, -1];
    assert.deepEqual(set.sort(function (a, b) {
      return b - a;
    }), expected);
  });

  it ('test sorting mulctiple values and slicing original', function() {
    var set = new Set();
    set.add(-1);
    set.add(2);
    set.add(5);
    set.add(1);
    set.sort(function (a, b) {
      return b - a;
    });

    var expected = [5, 2, 1, -1];
    assert.deepEqual(set.slice(), expected);
  });

  it ('test adding the same value twice', function() {
    var set = new Set();
    set.add(1);
    set.add(1);
    assert.equal(set.size(), 1);
    assert.deepEqual(set.slice(), [1]);
  });

  it ('test adding the same value multiple times', function() {
    var set = new Set();
    set.add(2);
    set.add(1);
    set.add(1);
    set.add(3);
    set.add(2);
    set.add(-1);
    set.add(2);
    set.add(3);
    assert.deepEqual(set.sort(function(a, b) {
      return b - a;
    }), [3, 2, 1, -1]);
  });

  it ('test adding vlaues by single entry and by array', function() {
    var set = new Set();
    set.add([4, -1]);
    assert.deepEqual(set.sort(function(a, b) {
      return b - a;
    }), [4, -1]);
  });

  it ('test adding vlaues by single entry and by array', function() {
    var set = new Set();
    set.add(2);
    set.add(1);
    set.add(3);
    set.add([4, -1]);
    assert.deepEqual(set.sort(function(a, b) {
      return b - a;
    }), [4, 3, 2, 1, -1]);
  });

  it ('test adding vlaues by multiple arrays', function() {
    var set = new Set();
    set.add([4, 3, 1, 2]);
    set.add([4, -1]);
    assert.deepEqual(set.sort(function(a, b) {
      return b - a;
    }), [4, 3, 2, 1, -1]);
  });

  it ('test sorting multiple times', function() {
    var set = new Set();
    set.add([4, 3, 1, 2]);
    assert.deepEqual(set.sort(function(a, b) {
      return b - a;
    }), [4, 3, 2, 1]);
    assert.deepEqual(set.slice(), [4, 3, 2, 1]);
    set.add([4, -1]);
    assert.deepEqual(set.sort(function(a, b) {
      return b - a;
    }), [4, 3, 2, 1, -1]);
  });

  it ('testing set foreach', function() {
    var set = new Set();
    set.add([4, 3, 1, 2]);
    var total = 0;
    set.forEach(function(item) {
      total += item;
    });
    assert.equal(total, 10);
  });
  //Justice\tAnd
  //Justice\tSir John Falstaff

  //<A NAME=1.1.76>O, were that all! I think not on my father;</A><br>
  //<A NAME=1.1.77>And these great tears grace his remembrance more</A><br>
  //<A NAME=1.1.78>Than those I shed for him. What was he like?</A><br>
  //<A NAME=1.1.79>I have forgot him: my imagination</A><br>
  //<A NAME=1.1.80>Carries no favour in't but Bertram's.</A><br>
  //<A NAME=1.1.81>I am undone: there is no living, none,</A><br>
  //<A NAME=1.1.82>If Bertram be away. 'Twere all one</A><br>
  //<A NAME=1.1.83>That I should love a bright particular star</A><br>
  //<A NAME=1.1.84>And think to wed it, he is so above me:</A><br>
  //<A NAME=1.1.85>In his bright radiance and collateral light</A><br>
  //<A NAME=1.1.86>Must I be comforted, not in his sphere.</A><br>
  //<A NAME=1.1.87>The ambition in my love thus plagues itself:</A><br>
  //<A NAME=1.1.88>The hind that would be mated by the lion</A><br>
  //<A NAME=1.1.89>Must die for love. 'Twas pretty, though plague,</A><br>
  //<A NAME=1.1.90>To see him every hour; to sit and draw</A><br>
  //<A NAME=1.1.91>His arched brows, his hawking eye, his curls,</A><br>
  //<A NAME=1.1.92>In our heart's table; heart too capable</A><br>
  //<A NAME=1.1.93>Of every line and trick of his sweet favour:</A><br>
  //<A NAME=1.1.94>But now he's gone, and my idolatrous fancy</A><br>
  //<A NAME=1.1.95>Must sanctify his reliques. Who comes here?</A><br>

  //<A NAME=1.1.320>And therefore, lovely Tamora, queen of Goths,</A><br>
  //<A NAME=1.1.321>That like the stately Phoebe 'mongst her nymphs</A><br>
  //<A NAME=1.1.322>Dost overshine the gallant'st dames of Rome,</A><br>
  //<A NAME=1.1.323>If thou be pleased with this my sudden choice,</A><br>
  //<A NAME=1.1.324>Behold, I choose thee, Tamora, for my bride,</A><br>
  //<A NAME=1.1.325>And will create thee empress of Rome,</A><br>
  //<A NAME=1.1.326>Speak, Queen of Goths, dost thou applaud my choice?</A><br>
  //<A NAME=1.1.327>And here I swear by all the Roman gods,</A><br>
  //<A NAME=1.1.328>Sith priest and holy water are so near</A><br>
  //<A NAME=1.1.329>And tapers burn so bright and every thing</A><br>
  //<A NAME=1.1.330>In readiness for Hymenaeus stand,</A><br>
  //<A NAME=1.1.331>I will not re-salute the streets of Rome,</A><br>
  //<A NAME=1.1.332>Or climb my palace, till from forth this place</A><br>
  //<A NAME=1.1.333>I lead espoused my bride along with me.</A><br>
  //{"_id" : ObjectId("556ae1099d631b4920deed4b"),
  //  "sentenceText" : "And therefore, lovely Tamora, queen of Goths, that like the stately Phoebe 'mongst her nymphs dost overshine the gallant'st dames of Rome, if thou be pleased with this my sudden choice, behold, I choose thee, Tamora, for my bride, and will create thee empress of Rome, speak, Queen of Goths, dost thou applaud my choice?",
  //  "dialogBlockStart" : "1.1.320",
  //  "dialogBlockEnd" : "1.1.333",
  //  "ICount" : 1,
  //  "youCount" : 0,
  //  "heCount" : 0,
  //  "sheCount" : 0,
  //  "theyCount" : 0,
  //  "weCount" : 0,
  //  "people" : [
  //  "Tamora",
  //  "Tamora"
  //],
  //  "locations" : [
  //  "Rome",
  //  "Rome",
  //  "Rome"
  //],
  //  "otherNouns" : [
  //  "Goths",
  //  "Phoebe",
  //  "Queen of Goths"
  //],
  //  "characterCount" : 320,
  //  "communicationType" : "question",
  //  "actNumber" : 1,
  //  "sceneNumber" : 1,
  //  "playTitle" : "Titus Andronicus",
  //  "speaker" : "Saturninus",
  //  "random" : 0.2896730974316597}



  //it ('regex ', function() {
  //  var text = "Cousin of Hereford, what dost thou object";
  //  var results = ParseUtils.extractProperNouns(text);
  //  assert.equal(results.length, 1);
  //  assert.equal(results[0], "Cousin of Hereford");
  //});
  //
  //it('regex', function() {
  //  var text = "Brought hither Henry Hereford thy bold son,";
  //  var results = ParseUtils.extractProperNouns(text);
  //  assert.equal(results.length, 1);
  //  assert.equal(results[0], "Henry Hereford");
  //});
});
