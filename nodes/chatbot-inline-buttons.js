var MessageTemplate = require('../lib/message-template-async');
var emoji = require('node-emoji');
var utils = require('../lib/helpers/utils');
var ChatExpress = require('../lib/chat-platform/chat-platform');

module.exports = function(RED) {

  function ChatBotInlineButtons(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.name = config.name;
    this.buttons = config.buttons;
    this.message = config.message;
    this.transports = ['telegram', 'facebook', 'smooch', 'slack', 'viber'];

    this.on('input', function(msg) {

      var transport = utils.getTransport(msg);

      // check if valid message
      if (!utils.isValidMessage(msg, node)) {
        return;
      }
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'message') && !utils.matchTransport(node, msg)) {
        return;
      }

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);

      // prepare buttons, first the config, then payload
      var buttons = utils.extractValue('buttons', 'buttons', node, msg);
      var message = utils.extractValue('string', 'message', node, msg);
      var name = utils.extractValue('string', 'name', node, msg);

      template(message)
        .then(function(message) {
          msg.payload = {
            type: 'inline-buttons',
            name: name,
            content: message != null ? emoji.emojify(message) : null,
            chatId: chatId,
            messageId: messageId,
            buttons: buttons
          };
          node.send(msg);
        });
    });

  }

  RED.nodes.registerType('chatbot-inline-buttons', ChatBotInlineButtons);
};
