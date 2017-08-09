var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var RequestBlock = require('../nodes/chatbot-request');

describe('Chat request node', function() {

  it('should be a request location', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'i am the request',
      requestType: 'location',
      buttonLabel: 'your position'
    });
    RequestBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'i am the request');
    assert.equal(RED.node.message().payload.type, 'request');
    assert.equal(RED.node.message().payload.requestType, 'location');
  });

  it('should be a request phone', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'i am the request',
      requestType: 'phone-number',
      buttonLabel: 'your phone'
    });
    RequestBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'i am the request');
    assert.equal(RED.node.message().payload.type, 'request');
    assert.equal(RED.node.message().payload.requestType, 'phone-number');
  });

  it('should be a request phone with emojii', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'i am the request :coffee:',
      requestType: 'phone-number',
      buttonLabel: 'your phone'
    });
    RequestBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'i am the request ☕️');
    assert.equal(RED.node.message().payload.type, 'request');
    assert.equal(RED.node.message().payload.requestType, 'phone-number');
  });


});

