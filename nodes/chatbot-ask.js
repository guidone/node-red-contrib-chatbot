var utils = require('../lib/helpers/utils');
var MessageTemplate = require('../lib/message-template-async');
var emoji = require('node-emoji');
var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotAsk(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.buttons = config.buttons;
    this.message = config.message;
    this.inline = config.inline;
    this.transports = ['telegram'];

    this.on('input', function(msg) {
      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var buttons = utils.extractValue('buttons', 'buttons', node, msg, true);
      var message = utils.extractValue('string', 'message', node, msg, false);

      // template then send
      template(message)
        .then(function(translated) {
          msg.payload = {
            type: _.isEmpty(buttons) ? 'reset-buttons': 'buttons',
            content: message != null ? emoji.emojify(translated) : null,
            chatId: chatId,
            messageId: messageId,
            buttons: buttons
          };
          node.send(msg);
        });
    });
  }

  RED.nodes.registerType('chatbot-ask', ChatBotAsk);
};
