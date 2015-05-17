var path = require('path');
var expect = require('chai').expect;

var module = require(path.join(__dirname, '..', './bardParse.js'));

describe('bardParse()', function () {
  'use strict';

  it('exists', function () {
    expect(module.BardParse).to.be.a('function');

  });

  it('does something', function () {
    var bardParse = new module.BardParse();
    bardParse.parseFromMIThtmlFile('../full.html');
  });

  it('does something else', function () {
    expect(true).to.equal(false);
  });

  // Add more assertions here
});
