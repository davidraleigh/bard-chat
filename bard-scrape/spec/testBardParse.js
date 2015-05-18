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

  it('does something else', function () {
    var dialog = new module.Dialog();
    var line1 = "Words words.";
    dialog.addLine(line1);
    var sentences = dialog.linesToSentences();
    console.log(sentences);
    assert(line1, sentences[0]);
//    expect(line1).to.equal(sentences[0]);
  });

  // Add more assertions here
});
