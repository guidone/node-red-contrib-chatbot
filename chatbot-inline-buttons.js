var _ = require('underscore');
var MessageTemplate = require('./lib/message-template.js');
var emoji = require('node-emoji');
var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotInlineButtons(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.answers = config.answers;
    this.message = config.message;
    this.transports = ['telegram', 'facebook', 'smooch'];

    this.on('input', function(msg) {

      // check transport compatibility
      if (!_.contains(node.transports, msg.originalMessage.transport)) {
        node.error('This node is not available for transport: ' + msg.originalMessage.transport);
        return;
      }

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!_.contains(node.transports, msg.originalMessage.transport)) {
        node.error('This node is not available for transport: ' + msg.originalMessage.transport);
        return;
      }

      // prepare answers, first the config, then payload
      var answers = null;
      if (_.isArray(node.answers) && !_.isEmpty(node.answers)) {
        answers = node.answers;
      } else if (_.isObject(msg.payload) && _.isArray(msg.payload.buttons) && !_.isEmpty(msg.payload.buttons)) {
        answers = msg.payload.buttons;
      }
      // prepare the message, first the config, then payload
      var message = null;
      if (_.isString(node.message) && !_.isEmpty(node.message)) {
        message = node.message;
      } else if (_.isObject(msg.payload) && _.isString(msg.payload.message) && !_.isEmpty(msg.payload.message)) {
        message = msg.payload.message;
      }

      msg.payload = {
        type: 'inline-buttons',
        content: message != null ? emoji.emojify(template(message)) : null,
        chatId: chatId,
        messageId: messageId,
        buttons: answers
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-inline-buttons', ChatBotInlineButtons);
};
