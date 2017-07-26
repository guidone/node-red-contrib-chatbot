var _ = require('underscore');
var MessageTemplate = require('./lib/message-template.js');
var emoji = require('node-emoji');
var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotQuickReplies(config) {
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

      // get values from config
      // prepare the message, first the config, then payload
      var buttons = utils.extractValue('buttons', 'buttons', node, msg);
      var message = utils.extractValue('string', 'message', node, msg);

      msg.payload = {
        type: 'quick-replies',
        content: message != null ? emoji.emojify(template(message)) : null,
        chatId: chatId,
        messageId: messageId,
        buttons: buttons
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-quick-replies', ChatBotQuickReplies);
};
