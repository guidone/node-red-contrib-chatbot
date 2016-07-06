var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var MessageBlock = require('../chatbot-message');

describe('Chat message node', function() {

  it('should send the message in the config', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'i am the message',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'i am the message');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.equal(RED.node.message().payload.inbound, false);
  });

  it('should pass through the message if not in the config', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: null,
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I am the original message');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.equal(RED.node.message().payload.inbound, false);
  });

  it('should answer to previous message', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: null,
      track: false,
      answer: true
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I am the original message');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.equal(RED.node.message().payload.options.reply_to_message_id, 72);
  });


});

