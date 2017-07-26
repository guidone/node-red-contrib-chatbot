var _ = require('underscore');
var MessageTemplate = require('./lib/message-template.js');
var emoji = require('node-emoji');
var utils = require('./lib/helpers/utils');
var validators = require('./lib/helpers/validators');

module.exports = function(RED) {

  function ChatBotGenericTemplate(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.name = config.name;
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

      // get values from config
      var buttons = utils.extractValue('buttons', 'buttons', node, msg);
      var title = utils.extractValue('string', 'title', node, msg);
      var subtitle = utils.extractValue('string', 'subtitle', node, msg);
      var imageUrl = utils.extractValue('string', 'imageUrl', node, msg);

      var elements = [];
      // if inbound is another message from a generic template, then push them toghether to create a carousel
      if (msg.payload != null && validators.genericTemplateElements(msg.payload.elements)) {
        elements = _.union(elements, msg.payload.elements);
      }
      // add the current one
      elements.push({
        title: title,
        subtitle: subtitle,
        imageUrl: imageUrl,
        buttons: buttons
      });

      msg.payload = {
        type: 'generic-template',
        elements: elements,
        chatId: chatId,
        messageId: messageId
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-generic-template', ChatBotGenericTemplate);
};
