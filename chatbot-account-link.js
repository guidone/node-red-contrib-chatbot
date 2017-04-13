var _ = require('underscore');
var MessageTemplate = require('./lib/message-template.js');
var emoji = require('node-emoji');
var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotRequest(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.authUrl = config.authUrl;
    this.transports = ['facebook'];

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var message = node.message;
      var authUrl = node.authUrl;
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      msg.payload = {
        type: 'account-link',
        chatId: chatId,
        messageId: messageId,
        content: emoji.emojify(template(message)),
        authUrl: authUrl
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-account-link', ChatBotRequest);
};
