var _ = require('underscore');
var MessageTemplate = require('./lib/message-template.js');
var emoji = require('node-emoji');
var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotGenericTemplate(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.buttons = config.buttons;
    this.message = config.message;
    this.transports = ['facebook'];

    this.on('input', function(msg) {

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      // prepare buttons, first the config, then payload
      var buttons = null;
      if (_.isArray(node.buttons) && !_.isEmpty(node.buttons)) {
        buttons = node.buttons;
      } else if (_.isObject(msg.payload) && _.isArray(msg.payload.buttons) && !_.isEmpty(msg.payload.buttons)) {
        buttons = msg.payload.buttons;
      }
      // prepare the message, first the config, then payload
      var message = null;
      if (_.isString(node.message) && !_.isEmpty(node.message)) {
        message = node.message;
      } else if (_.isObject(msg.payload) && _.isString(msg.payload.message) && !_.isEmpty(msg.payload.message)) {
        message = msg.payload.message;
      }

      msg.payload = {
        type: 'generic-template',
        content: message != null ? emoji.emojify(template(message)) : null,
        chatId: chatId,
        messageId: messageId,
        buttons: buttons
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-generic-template', ChatBotGenericTemplate);
};
