var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ConversationBlock = require('../chatbot-conversation');

describe('Chat conversation node', function() {

  it('should start a conversation', function() {
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

  it('should start a conversation passing parameters in the payload', function() {
    var msg = RED.createMessage({
      chatId: '4242',
      transport: 'telegram'
    });
    RED.node.config({
      chatId: null,
      transport: ''
    });
    ConversationBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().originalMessage.chat.id, '4242');
    assert.equal(RED.node.message().originalMessage.transport, 'telegram');
    assert.isFunction(RED.node.message().chat);
    assert.equal(RED.node.message().chat().get('transport'), 'telegram');
    assert.equal(RED.node.message().chat().get('chatId'), '4242');
  });

  it('should edit a message given the message id in the config panel', function() {
    var msg = RED.createMessage({
      chatId: '4242',
      transport: 'telegram'
    });
    RED.node.config({
      chatId: null,
      transport: '',
      messageId: '6262'
    });
    ConversationBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().originalMessage.chat.id, '4242');
    assert.equal(RED.node.message().originalMessage.transport, 'telegram');
    assert.equal(RED.node.message().originalMessage.modify_message_id, '6262');
    assert.isFunction(RED.node.message().chat);
    assert.equal(RED.node.message().chat().get('transport'), 'telegram');
    assert.equal(RED.node.message().chat().get('chatId'), '4242');
  });

  it('should edit a message given the message id in payload', function() {
    var msg = RED.createMessage({
      chatId: '4242',
      messageId: '6262',
      transport: 'telegram'
    });
    RED.node.config({
      chatId: null,
      transport: ''
    });
    ConversationBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().originalMessage.chat.id, '4242');
    assert.equal(RED.node.message().originalMessage.transport, 'telegram');
    assert.equal(RED.node.message().originalMessage.modify_message_id, '6262');
    assert.isFunction(RED.node.message().chat);
    assert.equal(RED.node.message().chat().get('transport'), 'telegram');
    assert.equal(RED.node.message().chat().get('chatId'), '4242');
  });

  it('should edit a message using the message id in the chat context', function() {
    var msg = RED.createMessage({
    });
    RED.node.config({
      chatId: '42',
      transport: 'telegram',
      contextMessageId: true
    });
    RED.environment.chat(msg.originalMessage.chat.id, {
      messageId: '6262'
    });
    ConversationBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().originalMessage.chat.id, '42');

    assert.equal(RED.node.message().originalMessage.modify_message_id, '6262');
    assert.equal(RED.node.message().originalMessage.transport, 'telegram');
    assert.isFunction(RED.node.message().chat);
  });

});

