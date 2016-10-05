var _ = require('underscore');
var MessageTemplate = require('./lib/message-template.js');
var emoji = require('node-emoji');

module.exports = function(RED) {

  function ChatBotRequest(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.buttonLabel = config.buttonLabel;
    this.requestType = config.requestType;
    this.transports = ['telegram', 'facebook'];

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var message = node.message;
      var requestType = node.requestType;
      var buttonLabel = node.buttonLabel;
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!_.contains(node.transports, msg.originalMessage.transport)) {
        node.error('This node is not available for transport: ' + msg.originalMessage.transport);
        return;
      }

      msg.payload = {
        type: 'request',
        requestType: requestType,
        label: buttonLabel,
        chatId: chatId,
        messageId: messageId,
        content: emoji.emojify(template(message))
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-request', ChatBotRequest);
};
