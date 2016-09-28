var _ = require('underscore');
var ChatContext = require('./lib/chat-context.js');
var moment = require('moment');
var MessageTemplate = require('./lib/message-template.js');
var emoji = require('node-emoji');

module.exports = function(RED) {

  function ChatBotAsk(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.answers = config.answers;
    this.message = config.message;
    this.transports = ['telegram', 'facebook', 'smooch'];

    this.on('input', function(msg) {

      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var answers = node.answers;
      var message = node.message;
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!_.contains(node.transports, msg.originalMessage.transport)) {
        node.error('This node is not available for transport: ' + msg.originalMessage.transport);
        return;
      }

      msg.payload = {
        type: 'buttons',
        content: emoji.emojify(template(message)),
        chatId: chatId,
        messageId: messageId,
        buttons: node.answers
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-ask', ChatBotAsk);

};
