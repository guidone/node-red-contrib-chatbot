var _ = require('underscore');
var assert = require('chai').assert;
var helpers = require('../lib/helpers/regexps');

describe('Helpers functions', function() {

  it('detect a command like message', function() {
    assert.isTrue(helpers.isCommand('/cmd'));
    assert.isTrue(helpers.isCommand('/Cmd'));
    assert.isTrue(helpers.isCommand('/cmd with params'));
    assert.isFalse(helpers.isCommand('I am not a command'));
    assert.isFalse(helpers.isCommand('  trailing spaces'));
    assert.isFalse(helpers.isCommand());
  });

  it('detect a url', function() {
    assert.equal(helpers.url('http://www.google.com'), 'http://www.google.com');
    assert.equal(helpers.url('www.google.com'), 'www.google.com');
    assert.isNull(helpers.url('I am not a url'));
    assert.isNull(helpers.url('a text with a url http://www.google.com'), 'http://www.google.com');
  });

  it('detect a number', function() {
    assert.equal(helpers.number('123232312'), '123232312');
    assert.isNull(helpers.url('I am not a number'));
  });

});

