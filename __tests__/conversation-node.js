var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var ConversationBlock = require('../nodes/chatbot-conversation');
var TelegramServer = require('../lib/telegram/telegram-chat');
var ContextProviders = require('../lib/chat-platform/chat-context-factory');
var contextProviders = ContextProviders(RED);

describe('Chat conversation node', function() {

  it('should start a conversation', function() {
    RED.node.config({
      chatId: '4242',
      transport: 'telegram',
      botTelegram: 'my-telegram'
    });
    var contextProvider = contextProviders.getProvider('memory');
    RED.nodes.setNode('my-telegram', {
      chat: TelegramServer.createServer({
        token: 'fake-token',
        contextProvider: contextProvider,
        RED: RED
      })
    });
    ConversationBlock(RED);
    RED.node.get().emit('input', {});
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().originalMessage.chatId, '4242');
        assert.equal(RED.node.message().originalMessage.transport, 'telegram');
        assert.isFunction(RED.node.message().chat);
        assert.equal(RED.node.message().chat().get('transport'), 'telegram');
        assert.equal(RED.node.message().chat().get('chatId'), '4242');
      });

  });

  it('should start a conversation passing parameters in the payload', function() {
    var msg = RED.createMessage({
      chatId: '4242'
    });
    RED.node.config({
      chatId: null,
      transport: 'telegram',
      botTelegram: 'my-telegram'
    });
    var contextProvider = contextProviders.getProvider('memory');
    RED.nodes.setNode('my-telegram', {
      chat: TelegramServer.createServer({
        token: 'fake-token',
        contextProvider: contextProvider,
        RED: RED
      })
    });
    ConversationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().originalMessage.chatId, '4242');
        assert.equal(RED.node.message().originalMessage.transport, 'telegram');
        assert.isFunction(RED.node.message().chat);
        assert.equal(RED.node.message().chat().get('transport'), 'telegram');
        assert.equal(RED.node.message().chat().get('chatId'), '4242');
      });
  });

  it('should edit a message given the message id in the config panel', function() {
    var msg = RED.createMessage({
      chatId: '4242'
    });
    RED.node.config({
      chatId: null,
      transport: 'telegram',
      botTelegram: 'my-telegram',
      messageId: '6262'
    });
    var contextProvider = contextProviders.getProvider('memory');
    RED.nodes.setNode('my-telegram', {
      chat: TelegramServer.createServer({
        token: 'fake-token',
        contextProvider: contextProvider,
        RED: RED
      })
    });
    ConversationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().originalMessage.chatId, '4242');
        assert.equal(RED.node.message().originalMessage.transport, 'telegram');
        assert.equal(RED.node.message().originalMessage.modifyMessageId, '6262');
        assert.isFunction(RED.node.message().chat);
        assert.equal(RED.node.message().chat().get('transport'), 'telegram');
        assert.equal(RED.node.message().chat().get('chatId'), '4242');
      });
  });

  it('should edit a message given the message id in payload', function() {
    var msg = RED.createMessage({
      chatId: '4242',
      messageId: '6262'
    });
    RED.node.config({
      chatId: null,
      transport: 'telegram',
      botTelegram: 'my-telegram'
    });
    var contextProvider = contextProviders.getProvider('memory');
    RED.nodes.setNode('my-telegram', {
      chat: TelegramServer.createServer({
        token: 'fake-token',
        contextProvider: contextProvider,
        RED: RED
      })
    });
    ConversationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().originalMessage.chatId, '4242');
        assert.equal(RED.node.message().originalMessage.transport, 'telegram');
        assert.equal(RED.node.message().originalMessage.modifyMessageId, '6262');
        assert.isFunction(RED.node.message().chat);
        assert.equal(RED.node.message().chat().get('transport'), 'telegram');
        assert.equal(RED.node.message().chat().get('chatId'), '4242');
      });
  });

});

