var _ = require('underscore');
var ChatContextStore = require('../lib/chat-context-store');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {


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
    this.botFacebook = config.botFacebook;
    this.botViber = config.botViber;

    this.on('input', function(msg) {

      var chatId = utils.extractValue('string', 'chatId', node, msg, false);
      var transport = utils.extractValue('string', 'transport', node, msg, false);
      var messageId = utils.extractValue('string', 'messageId', node, msg, false);
      var contextMessageId = utils.extractValue('boolean', 'contextMessageId', node, msg, false);
      var botTelegram = node.botTelegram;
      var botSlack = node.botSlack;
      var botFacebook = node.botFacebook;
      var botViber = node.botViber;

      if (transport === 'slack' || transport === 'telegram' || transport === 'facebook' || transport === 'viber') {
        //var store = RED.nodes.getNode(node.store);
        var platformNode = null;
        if (transport === 'slack' && RED.nodes.getNode(botSlack) != null) {
          platformNode = RED.nodes.getNode(botSlack).chat;
        } else if (transport === 'telegram' && RED.nodes.getNode(botTelegram) != null) {
          platformNode = RED.nodes.getNode(botTelegram).chat;
        } else if (transport === 'facebook' && RED.nodes.getNode(botFacebook) != null) {
          platformNode = RED.nodes.getNode(botFacebook).chat;
        } else if (transport === 'viber' && RED.nodes.getNode(botViber) != null) {
          platformNode = RED.nodes.getNode(botViber).chat;
        } else {
          node.error('Chatbot not found or not configured properly');
          return;
        }
        // check if chat is null, perhaps the node exists but it's not used by any receiver
        if (platformNode == null) {
          node.error('No active chatbot for this configuration. Means that the configuration was found but no receiver node is using it');
          return;
        }
        var message = null;
        platformNode.createMessage(chatId, null, messageId, msg)
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
