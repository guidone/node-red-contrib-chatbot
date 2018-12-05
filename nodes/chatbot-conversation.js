var _ = require('underscore');
var ChatContextStore = require('../lib/chat-context-store');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {


  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var global = this.context().global;
    var environment = global.environment === 'production' ? 'production' : 'development';

    this.chatId = config.chatId;
    this.transport = config.transport;
    this.contextMessageId = config.contextMessageId;
    this.messageId = config.messageId;
    this.store = config.store;
    this.botTelegram = config.botTelegram;
    this.botTelegramProduction = config.botTelegramProduction;
    this.botSlack = config.botSlack;
    this.botSlackProduction = config.botSlackProduction;
    this.botFacebook = config.botFacebook;
    this.botFacebookProduction = config.botFacebookProduction;
    this.botViber = config.botViber;
    this.botViberProduction = config.botViberProduction;
    this.botUniversal = config.botUniversal;
    this.botUniversalProduction = config.botUniversalProduction;
    this.botTwilio = config.botTwilio;
    this.botTwilioProduction = config.botTwilioProduction;

    this.on('input', function(msg) {

      var chatId = utils.extractValue('string', 'chatId', node, msg, false)
        || utils.extractValue('number', 'chatId', node, msg, false);
      var transport = utils.extractValue('string', 'transport', node, msg, false);
      var messageId = utils.extractValue('string', 'messageId', node, msg, false)
        || utils.extractValue('number', 'messageId', node, msg, false);
      var contextMessageId = utils.extractValue('boolean', 'contextMessageId', node, msg, false);
      var botTelegram = global.environment === 'production' ? node.botTelegramProduction : node.botTelegram;
      var botSlack = global.environment === 'production' ? node.botSlackProduction : node.botSlack;
      var botFacebook = global.environment === 'production' ? node.botFacebookProduction : node.botFacebook;
      var botViber = global.environment === 'production' ? node.botViberProduction : node.botViber;
      var botUniversal = global.environment === 'production' ? node.botUniversalProduction : node.botUniversal;
      var botTwilio = global.environment === 'production' ? node.botTwilioProduction : node.botTwilio;

      if (transport !== 'smooch') {
        var platformNode = null;
        if (transport === 'slack' && RED.nodes.getNode(botSlack) != null) {
          platformNode = RED.nodes.getNode(botSlack).chat;
        } else if (transport === 'telegram' && RED.nodes.getNode(botTelegram) != null) {
          platformNode = RED.nodes.getNode(botTelegram).chat;
        } else if (transport === 'facebook' && RED.nodes.getNode(botFacebook) != null) {
          platformNode = RED.nodes.getNode(botFacebook).chat;
        } else if (transport === 'viber' && RED.nodes.getNode(botViber) != null) {
          platformNode = RED.nodes.getNode(botViber).chat;
        } else if (transport === 'universal' && RED.nodes.getNode(botUniversal) != null) {
          platformNode = RED.nodes.getNode(botUniversal).chat;
        } else if (transport === 'twilio' && RED.nodes.getNode(botTwilio) != null) {
          platformNode = RED.nodes.getNode(botTwilio).chat;
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
            modifyMessageId: messageId,
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
