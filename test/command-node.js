var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var CommandBlock = require('../chatbot-command');

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

});
