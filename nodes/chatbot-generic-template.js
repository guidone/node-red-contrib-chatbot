var _ = require('underscore');
var MessageTemplate = require('../lib/message-template-async');
var utils = require('../lib/helpers/utils');
var validators = require('../lib/helpers/validators');

module.exports = function(RED) {

  function ChatBotGenericTemplate(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.name = config.name;
    this.buttons = config.buttons;
    this.title = config.title;
    this.subtitle = config.subtitle;
    this.imageUrl = config.imageUrl;
    this.aspectRatio = config.aspectRatio;
    this.sharable = config.sharable;
    this.transports = ['facebook', 'slack'];

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
      var aspectRatio = utils.extractValue('string', 'aspectRatio', node, msg);
      var sharable = utils.extractValue('boolean', 'sharable', node, msg);

      var elements = [];
      // if inbound is another message from a generic template, then push them toghether to create a carousel
      if (msg.payload != null && validators.genericTemplateElements(msg.payload.elements)) {
        elements = _.union(elements, msg.payload.elements);
      }

      template(title, subtitle, imageUrl)
        .then(function(translated) {
          // add the current one if not empty
          if (!_.isEmpty(translated[0])) {
            elements.push({
              title: translated[0],
              subtitle: translated[1],
              imageUrl: translated[2],
              buttons: buttons
            });
          }
          // prep payload
          msg.payload = {
            type: 'generic-template',
            aspectRatio: !_.isEmpty(aspectRatio) ? aspectRatio : 'horizontal',
            sharable: _.isBoolean(sharable) ? sharable : true,
            elements: elements,
            chatId: chatId,
            messageId: messageId
          };
          node.send(msg);
        });
    });
  }

  RED.nodes.registerType('chatbot-generic-template', ChatBotGenericTemplate);
};
