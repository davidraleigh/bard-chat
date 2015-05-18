var path = require('path');
var assert = require('assert');

var module = require(path.join(__dirname, '..', './bardParse.js'));

describe('bardParse()', function () {
  'use strict';

  it('exists', function () {

    //expect(module.BardParse).to.be.a('function');

  });

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
    console.log(sentences);
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
    console.log(sentences);
    assert.equal("Words words tWords words.", sentences[0]);
  });

  it('test two sentences two lines', function () {
    var dialog = new module.Dialog();
    var line1 = "Words. Words";
    var line2 = "TWords words.";
    dialog.addLine(line1);
    dialog.addLine(line2);
    dialog.linesToSentences();
    var sentences = dialog.getSentences();
    console.log(sentences);
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
    console.log(sentences);
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
    console.log(sentences);
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
    console.log(sentences);
    assert.equal("Words Words Words words Words Words words Words Words words.", sentences[0]);
    assert.equal("Words2 words2 words2 Words2 Words2.", sentences[1]);
  });
  // Add more assertions here
});
