var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var RequestBlock = require('../chatbot-request');

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
    assert.equal(RED.node.message().payload.options.reply_markup, '{"keyboard":[[{"text":"your position","request_location":true}]],"resize_keyboard":true,"one_time_keyboard":true}');
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
    assert.equal(RED.node.message().payload.options.reply_markup, '{"keyboard":[[{"text":"your phone","request_contact":true}]],"resize_keyboard":true,"one_time_keyboard":true}');
  });

});

