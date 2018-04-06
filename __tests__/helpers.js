var _ = require('underscore');
var assert = require('chai').assert;
var helpers = require('../lib/helpers/regexps');
var utils = require('../lib/helpers/utils');
var RED = require('../lib/red-stub')();

describe('Helpers functions', function() {

  it('detect a command like message', function() {
    assert.isTrue(helpers.isCommand('/cmd'));
    assert.isTrue(helpers.isCommand('/Cmd'));
    assert.isTrue(helpers.isCommand('/cmd with params'));
    assert.isTrue(helpers.isCommand('/cmd_particular with params', '/cmd_particular'));
    assert.isTrue(helpers.isCommand('/cmd with params', '/cmd'));
    assert.isFalse(helpers.isCommand('I am not a command'));
    assert.isFalse(helpers.isCommand('  trailing spaces'));
    assert.isFalse(helpers.isCommand());
    assert.isFalse(helpers.isCommand('/cmd with params', 'another_cmd'));
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

describe('Value extractors', function() {

  var extractValue = utils.extractValue;

  it('should extract a boolean', function() {
    var msg1 = RED.createMessage(true);
    var msg2 = RED.createMessage({ aBoolean: true });
    var msg3 = RED.createMessage('wrong type');
    assert.equal(extractValue('boolean', 'aBoolean', RED.node , msg1), true);
    assert.equal(extractValue('boolean', 'aBoolean', RED.node , msg2), true);
    assert.equal(extractValue('boolean', 'aBoolean', RED.node , msg3), null);
  });

  it('should extract a string', function() {
    var msg1 = RED.createMessage('I am a string');
    var msg2 = RED.createMessage({ aString: 'I am a string' });
    var msg3 = RED.createMessage(42);
    assert.equal(extractValue('string', 'aString', RED.node , msg1), 'I am a string');
    assert.equal(extractValue('string', 'aString', RED.node , msg2), 'I am a string');
    assert.equal(extractValue('string', 'aString', RED.node , msg3), null);
  });

  it('should extract a buffer', function() {
    var msg1 = RED.createMessage(new Buffer('just a buffer'));
    var msg2 = RED.createMessage({ aBuffer: new Buffer('just a buffer') });
    var msg3 = RED.createMessage(42);
    assert.instanceOf(extractValue('buffer', 'aBuffer', RED.node , msg1), Buffer);
    assert.instanceOf(extractValue('buffer', 'aBuffer', RED.node , msg2), Buffer);
    assert.equal(extractValue('buffer', 'aBuffer', RED.node , msg3), null);
  });

  it('should extract an array', function() {
    var msg1 = RED.createMessage([1, 2, 3]);
    var msg2 = RED.createMessage({ anArray: [1, 2, 3] });
    var msg3 = RED.createMessage(42);
    assert.isArray(extractValue('array', 'anArray', RED.node , msg1));
    assert.equal(extractValue('array', 'anArray', RED.node , msg1)[0], 1);
    assert.equal(extractValue('array', 'anArray', RED.node , msg1)[1], 2);
    assert.equal(extractValue('array', 'anArray', RED.node , msg1)[2], 3);
    assert.isArray(extractValue('array', 'anArray', RED.node , msg1));
    assert.equal(extractValue('array', 'anArray', RED.node , msg2)[0], 1);
    assert.equal(extractValue('array', 'anArray', RED.node , msg2)[1], 2);
    assert.equal(extractValue('array', 'anArray', RED.node , msg2)[2], 3);
    assert.equal(extractValue('array', 'anArray', RED.node , msg3), null);
  });

  it('should extract an array of object', function() {
    var msg1 = RED.createMessage([{}, {}, {}]);
    var msg2 = RED.createMessage({ anArrayOfObject: [{}, {}, {}] });
    var msg3 = RED.createMessage(42);
    assert.isArray(extractValue('arrayOfObject', 'anArrayOfObject', RED.node , msg1));
    assert.isArray(extractValue('arrayOfObject', 'anArrayOfObject', RED.node , msg2));
    assert.equal(extractValue('arrayOfObject', 'anArrayOfObject', RED.node , msg3), null);
  });

  it('should extract an hash', function() {
    var msg1 = RED.createMessage({ randomValue: 42 });
    var msg2 = RED.createMessage({ anHash: { randomValue: 42} });
    var msg3 = RED.createMessage({ chatId: 42});
    assert.isObject(extractValue('hash', 'anHash', RED.node , msg1));
    assert.equal(extractValue('hash', 'anHash', RED.node , msg1).randomValue, 42);
    assert.isObject(extractValue('hash', 'anHash', RED.node , msg2));
    assert.equal(extractValue('hash', 'anHash', RED.node , msg2).randomValue, 42);
    assert.equal(extractValue('hash', 'anHash', RED.node , msg3), null);
  });

});

