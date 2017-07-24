var _ = require('underscore');
var MessageTemplate = require('./lib/message-template.js');
var emoji = require('node-emoji');
var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotGenericTemplate(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.buttons = config.buttons;
    this.title = config.title;
    this.subtitle = config.subtitle;
    this.imageUrl = config.imageUrl;
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

      // get values from config
      var buttons = utils.extractValue('array', 'buttons', node, msg);
      var title = utils.extractValue('string', 'title', node, msg);
      var subtitle = utils.extractValue('string', 'subtitle', node, msg);
      var imageUrl = utils.extractValue('string', 'imageUrl', node, msg);

      msg.payload = {
        type: 'generic-template',
        title: title,
        subtitle: subtitle,
        imageUrl: imageUrl,
        chatId: chatId,
        messageId: messageId,
        buttons: buttons
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-generic-template', ChatBotGenericTemplate);
};
