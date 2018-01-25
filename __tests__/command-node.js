var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var CommandBlock = require('../nodes/chatbot-command');

describe('Chat command node', function() {

  it('should answer for a message with /help', function () {
    var msg = RED.createMessage({content: '/start'});
    RED.node.config({
      command: 'start'
    });
    CommandBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, '/start');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
  });

  it('should not answer for a message with /test', function () {
    var msg = RED.createMessage({content: '/test'});
    RED.node.config({
      command: 'start'
    });
    CommandBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message(), null);
  });

  it('should answer for a message with /test even in a telegram group', function () {
    var msg = RED.createMessage({content: '/test@guidone'});
    RED.node.config({
      command: 'test'
    });
    CommandBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, '/test@guidone');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
  });

  it('should answer for a message with /test with parameter', function () {
    var msg = RED.createMessage({content: '/test sun trees'});
    RED.node.config({
      command: 'test'
    });
    CommandBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, '/test sun trees');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
    assert.equal(msg.chat().get('param1'), 'sun');
    assert.equal(msg.chat().get('param2'), 'trees');
  });

});
