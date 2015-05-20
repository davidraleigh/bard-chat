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
});
