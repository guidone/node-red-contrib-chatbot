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


  it('should raise error if no chatId and userId are specified', () => {
    const msg = RED.createMessage({});
    RED.node.config({});
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
      .then(
        () => {},
        () => {
          assert.isNull(RED.node.message());
          assert.equal(RED.node.error(), 'Both userId and chatId empty, cannot start a conversation');
        }
      );
  });

  it('should raise error if no chatId and and no bot is specified', () => {
    const msg = RED.createMessage({ chatId: 42 });
    RED.node.config({});
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
      .then(
        () => {},
        () => {
          assert.isNull(RED.node.message());
          assert.equal(RED.node.error(), 'chatId was correctly specified but without a valid chatbot configuration');
        }
      );
  });

});
