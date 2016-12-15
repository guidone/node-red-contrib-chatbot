var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ConversationBlock = require('../chatbot-conversation');

describe('Chat conversation node', function() {

  it('should start a conversation', function() {
    //var msg = RED.createMessage();
    RED.node.config({
      chatId: '4242',
      transport: 'telegram'
    });
    ConversationBlock(RED);
    RED.node.get().emit('input', {});
    assert.equal(RED.node.message().originalMessage.chat.id, '4242');
    assert.equal(RED.node.message().originalMessage.transport, 'telegram');
    assert.isFunction(RED.node.message().chat);
    assert.equal(RED.node.message().chat().get('transport'), 'telegram');
    assert.equal(RED.node.message().chat().get('chatId'), '4242');
  });

});

