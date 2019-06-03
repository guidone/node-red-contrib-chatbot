var _ = require('underscore');
var ChatContextStore = require('../lib/chat-context-store');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {


  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const global = this.context().global;

    this.chatId = config.chatId;
    this.userId = config.userId;
    this.transport = config.transport;

    this.store = config.store;
    this.botProduction = config.botProduction;
    this.botDevelopment = config.botDevelopment;


    this.on('input', msg => {

      const chatId = utils.extractValue('string', 'chatId', node, msg, false)
      const userId = utils.extractValue('string', 'userId', node, msg, false)
        || utils.extractValue('number', 'userId', node, msg, false);
      //var transport = utils.extractValue('string', 'transport', node, msg, false);


      const botNode = global.environment === 'production' ? node.botProduction : node.botDevelopment;


      /*var messageId = utils.extractValue('string', 'messageId', node, msg, false)
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
      var botDiscord = global.environment === 'production' ? node.botDiscordProduction : node.botDiscord;*/




      let platformNode = null;

      if (RED.nodes.getNode(botNode) != null) {
        platformNode = RED.nodes.getNode(botNode).chat;
      }
      // check if chat is null, perhaps the node exists but it's not used by any receiver
      if (platformNode == null) {
        node.error('No active chatbot for this configuration. Means that the configuration was found but no receiver node is using it');
        return;
      }
      //let message = null;
      platformNode.createMessage(chatId, userId, null, msg)
        .then(message => node.send(message));
        /*.then(function(createdMessage) {
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
        });*/

    });
  }

  RED.nodes.registerType('chatbot-conversation', ChatBotConversation);
};
