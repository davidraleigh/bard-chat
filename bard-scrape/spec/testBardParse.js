var path = require('path');
var assert = require('assert');

var module = require(path.join(__dirname, '..', './bardParse.js'));
var ParseUtils = require(path.join(__dirname, '..', './parseUtils.js')).ParseUtils;

describe('bardParse()', function () {
  'use strict';

  it('does something', function () {
    var bardParse = new module.BardParse();
    bardParse.parseFromMIThtmlFile('../full.html');
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
    assert.equal(sentences[1], 'asdfasdf.');
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
    var bardParse = new module.BardParse();
    var text = "An Animal";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
  });

  it ('regex test', function () {
    var bardParse = new module.BardParse();
    var text = "An Animal is not Bland. Andrew Is Also not Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Stupid");
  });


  it ('regex test lots of words', function () {
    var bardParse = new module.BardParse();
    var text = "An Animal is not Bland! Andrew Is Also not Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Stupid");
  });

  it ('regex test with double spaces and lots of ??!!', function () {
    var bardParse = new module.BardParse();
    var text = "An Animal is not Bland!!? Andrew Is.   Also not Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Stupid");
  });

  it ('regex test with period and newline', function () {
    var bardParse = new module.BardParse();
    var text = "An Animal is not Bland!!? Andrew Is.\nAlso not Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Stupid");
  });


  it ('regex test with new line', function () {
    var bardParse = new module.BardParse();
    var text = "An Animal is not Bland! Andrew Is\nAlso not Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Stupid");
  });

  it ('regex test with I', function () {
    var bardParse = new module.BardParse();
    var text = "An Animal is not I Bland! Andrew Is\nAlso not Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Stupid");
  });

  it ('regex test with double spaces and lots of ??!!', function () {
    var bardParse = new module.BardParse();
    var text = "An Animal is not Bland!!? Andrew    Is\tAlso    not     Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Stupid");
  });

  //[To HELENA]  The best wishes that can be forged in
  it ('regex test with a bracket', function () {
    var bardParse = new module.BardParse();
    var text = "[To HELENA]  An Animal is not Bland!!? Andrew    Is\tAlso    not     Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Stupid");
  });

  it ('regex test with a tab', function () {
    var bardParse = new module.BardParse();
    var text = "  An Animal is not Bland!!? Andrew    Is\tAlso    not     Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Animal");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Stupid");
  });

  // Gerard de Vabon

  it ('regex test with a Gerard de Vabon', function () {
    var bardParse = new module.BardParse();
    var text = "  An Gerard de Vabon is not Bland!!? Andrew    Is\tAlso    not     Paul de Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Gerard de Vabon");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Paul de Stupid");
  });

  it ('regex test with a Paul of Stupid', function () {
    var bardParse = new module.BardParse();
    var text = "  An Gerard de Vabon is not Bland!!? Andrew    Is\tAlso    not     Paul of Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Gerard de Vabon");
    assert.equal(results[1], "Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Paul of Stupid");
  });

  it ('regex test with a Paul of Stupid', function () {
    var bardParse = new module.BardParse();
    var text = "  An Captain Vabon is not King Bland!!? Andrew    Is\tAlso    not     Paul of Stupid.";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results[0], "Captain Vabon");
    assert.equal(results[1], "King Bland");
    assert.equal(results[2], "Is");
    assert.equal(results[3], "Also");
    assert.equal(results[4], "Paul of Stupid");
  });

  it ('regex ." sentence completion', function() {
    var bardParse = new module.BardParse();
    var text = "Crying, 'That's good that's gone.' Our rash faults";
    var results = bardParse.parseProperNouns(text);
    assert.equal(results.length, 0);
  });
});
