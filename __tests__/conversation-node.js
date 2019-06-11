const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const ConversationBlock = require('../nodes/chatbot-conversation');
const TelegramServer = require('../lib/platforms/telegram');
const { ContextProviders } = require('chat-platform');
const contextProviders = ContextProviders(RED);

describe('Chat conversation node', () => {

  it('should start a conversation', () => {
    RED.node.config({
      chatId: '4242',
      transport: 'telegram',
      botDevelopment: 'my-telegram'
    });
    const contextProvider = contextProviders.getProvider('memory');
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
      .then(() => {
        assert.equal(RED.node.message().originalMessage.chatId, '4242');
        assert.equal(RED.node.message().originalMessage.transport, 'telegram');
        assert.isFunction(RED.node.message().chat);
        assert.equal(RED.node.message().chat().get('transport'), 'telegram');
        assert.equal(RED.node.message().chat().get('chatId'), '4242');
      });

  });

  it('should start a conversation passing parameters in the payload', () => {
    const msg = RED.createMessage({
      chatId: '4242'
    });
    RED.node.config({
      chatId: null,
      transport: 'telegram',
      botDevelopment: 'my-telegram'
    });
    const contextProvider = contextProviders.getProvider('memory');
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
      .then(() => {
        assert.equal(RED.node.message().originalMessage.chatId, '4242');
        assert.equal(RED.node.message().originalMessage.transport, 'telegram');
        assert.isFunction(RED.node.message().chat);
        assert.equal(RED.node.message().chat().get('transport'), 'telegram');
        assert.equal(RED.node.message().chat().get('chatId'), '4242');
      });
  });




});

