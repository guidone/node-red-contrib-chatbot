var _ = require('underscore');
var ChatContextStore = require('../lib/chat-context-store');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {


  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var global = this.context().global;

    this.chatId = config.chatId;
    this.userId = config.userId;
    this.transport = config.transport;
    this.contextMessageId = config.contextMessageId;
    this.messageId = config.messageId;
    this.store = config.store;
    this.botTelegram = config.botTelegram;
    this.botTelegramProduction = config.botTelegramProduction;
    this.botSlack = config.botSlack;
    this.botSlackProduction = config.botSlackProduction;
    this.botSinchSMS = config.botSinchSMS;
    this.botSinchSMSProduction = config.botSinchSMSProduction;
    this.botSinchWhatsApp = config.botSinchWhatsApp;
    this.botSinchWhatsAppProduction = config.botSinchWhatsAppProduction;
    this.botFacebook = config.botFacebook;
    this.botFacebookProduction = config.botFacebookProduction;
    this.botViber = config.botViber;
    this.botViberProduction = config.botViberProduction;
    this.botUniversal = config.botUniversal;
    this.botUniversalProduction = config.botUniversalProduction;
    this.botTwilio = config.botTwilio;
    this.botTwilioProduction = config.botTwilioProduction;
    this.botDiscord = config.botDiscord;
    this.botDiscordProduction = config.botDiscordProduction;



    this.on('input', function(msg) {

      var chatId = utils.extractValue('string', 'chatId', node, msg, false)
      var userId = utils.extractValue('string', 'userId', node, msg, false)
        || utils.extractValue('number', 'userId', node, msg, false);
      var transport = utils.extractValue('string', 'transport', node, msg, false);
      var messageId = utils.extractValue('string', 'messageId', node, msg, false)
        || utils.extractValue('number', 'messageId', node, msg, false);
      var contextMessageId = utils.extractValue('boolean', 'contextMessageId', node, msg, false);
      var botTelegram = global.environment === 'production' ? node.botTelegramProduction : node.botTelegram;
      var botSlack = global.environment === 'production' ? node.botSlackProduction : node.botSlack;
      var botSinchSMS = global.environment === 'production' ? node.botSinchSMSProduction : node.botSinchSMS;
      var botSinchWhatsApp = global.environment === 'production' ? node.botSinchWhatsAppProduction : node.botSinchWhatsApp;
      var botFacebook = global.environment === 'production' ? node.botFacebookProduction : node.botFacebook;
      var botViber = global.environment === 'production' ? node.botViberProduction : node.botViber;
      var botUniversal = global.environment === 'production' ? node.botUniversalProduction : node.botUniversal;
      var botTwilio = global.environment === 'production' ? node.botTwilioProduction : node.botTwilio;
      var botDiscord = global.environment === 'production' ? node.botDiscordProduction : node.botDiscord;



      if (transport !== 'smooch') {
        var platformNode = null;
        if (transport === 'sinch-sms' && RED.nodes.getNode(botSinchSMS) != null) {
          platformNode = RED.nodes.getNode(botSinchSMS).chat;
        } else if (transport === 'sinch-whatsapp' && RED.nodes.getNode(botSinchWhatsApp) != null) {
          platformNode = RED.nodes.getNode(botSinchWhatsApp).chat;
        } else if (transport === 'slack' && RED.nodes.getNode(botSlack) != null) {
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
        } else if (transport === 'discord' && RED.nodes.getNode(botDiscord) != null) {
          platformNode = RED.nodes.getNode(botDiscord).chat;
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
        platformNode.createMessage(chatId, userId, messageId, msg)
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
