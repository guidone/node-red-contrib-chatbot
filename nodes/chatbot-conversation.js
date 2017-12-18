var _ = require('underscore');
var ChatContextStore = require('../lib/chat-context-store');
var ContextProviders = require('../lib/chat-platform/chat-context-factory');
var utils = require('../lib/helpers/utils');
var when = utils.when;

module.exports = function(RED) {

  var contextProviders = ContextProviders(RED);

  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.chatId = config.chatId;
    this.transport = config.transport;
    this.contextMessageId = config.contextMessageId;
    this.messageId = config.messageId;
    this.store = config.store;
    this.botTelegram = config.botTelegram;
    this.botSlack = config.botSlack;

    this.on('input', function(msg) {

      var chatId = utils.extractValue('string', 'chatId', node, msg, false);
      var transport = utils.extractValue('string', 'transport', node, msg, false);
      var messageId = utils.extractValue('string', 'messageId', node, msg, false);
      var contextMessageId = utils.extractValue('boolean', 'contextMessageId', node, msg, false);
      var botTelegram = node.botTelegram;
      var botSlack = node.botSlack;

      if (transport === 'slack' || transport === 'telegram') {
        //var store = RED.nodes.getNode(node.store);
        var platformNode = null;
        if (transport === 'slack' && RED.nodes.getNode(botSlack) != null) {
          platformNode = RED.nodes.getNode(botSlack).chat;
        } else if (transport === 'telegram' && RED.nodes.getNode(botTelegram) != null) {
          platformNode = RED.nodes.getNode(botTelegram).chat;
        } else {
          node.error('Chatbot not found or not configured properly');
          return;
        }

        var message = null;
        platformNode.createMessage(chatId, null, messageId)
          .then(function(createdMessage) {
            message = createdMessage;
            if (contextMessageId === true) {
              return message.chat().get('messageId');
            } else if (messageId != null) {
              return messageId
            }
            return null;
          })
          .then(function(fetchedMessageId) {
            if (fetchedMessageId != null) {
              message.originalMessage.modifyMessageId = fetchedMessageId;
            }
            node.send(message);
          });

        /*var contextProvider = contextProviders.getProvider(
          store.contextStorage,
          store.contextParams
        );
        task = task.then(function() {
          return contextProvider.getOrCreate(chatId, {
            chatId: chatId,
            transport: transport,
            authorized: false
          });
        });*/
      } else {

        var task = new Promise(function(resolve) {
          resolve();
        });

        task = task.then(function() {
          return ChatContextStore.getOrCreateChatContext(node, chatId, {
            chatId: chatId,
            transport: transport,
            authorized: false
          });
        });

        task.then(function(chatContext) {
          // ensure the original message is injected
          msg.originalMessage = {
            chat: {
              id: chatId
            },
            message_id: null,
            modify_message_id: messageId,
            transport: transport
          };
          msg.chat = function() {
            return chatContext;
          };
          // fix chat id in payload if any
          if (_.isObject(msg.payload) && msg.payload.chatId != null) {
            msg.payload.chatId = chatId;
          }
          node.send(msg);
        });
      }


    });

  }

  RED.nodes.registerType('chatbot-conversation', ChatBotConversation);
};
