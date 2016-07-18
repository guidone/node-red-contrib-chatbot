var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var LocationBlock = require('../chatbot-location');

describe('Chat request node', function() {

  it('should send a location message in Telegram', function() {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      latitude: '45.4842045',
      longitude: '9.1809077'
    });
    LocationBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isObject(RED.node.message().payload.content, 'is an object');
    assert.equal(RED.node.message().payload.content.latitude, '45.4842045');
    assert.equal(RED.node.message().payload.content.longitude, '9.1809077');
  });

  it('should send a location message in Slack', function() {
    var msg = RED.createMessage(null, 'slack');
    RED.node.config({
      latitude: '45.4842045',
      longitude: '9.1809077'
    });
    LocationBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isObject(RED.node.message().payload.content, 'is an object');
    assert.equal(RED.node.message().payload.content.latitude, '45.4842045');
    assert.equal(RED.node.message().payload.content.longitude, '9.1809077');
  });

});

