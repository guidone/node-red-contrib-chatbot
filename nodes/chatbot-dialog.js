var _ = require('underscore');
var MessageTemplate = require('../lib/message-template-async');
var utils = require('../lib/helpers/utils');
var validators = require('../lib/helpers/validators');

module.exports = function(RED) {

  function ChatBotDialog(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.name = config.name;
    this.elements = config.elements;
    this.title = config.title;
    this.submitLabel = config.submitLabel;
    this.transports = ['slack'];

    this.on('input', function(msg) {

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var title = utils.extractValue('string', 'title', node, msg, false);
      var submitLabel = utils.extractValue('string', 'submitLabel', node, msg, false);
      var elements = utils.extractValue('arrayOfObject', 'elements', node, msg, true);


      /*

      [
          {
            "type": "text",
            "label": "Pickup Location",
            "name": "loc_origin"
          },
          {
            "type": "text",
            "label": "Dropoff Location",
            "name": "loc_destination"
          }
        ]
       */


      // payload
      msg.payload = {
        type: 'dialog',
        title: title,
        submitLabel: submitLabel,
        elements: elements,
        chatId: chatId,
        messageId: messageId
      };
      node.send(msg);


      /*var elements = [];
      // if inbound is another message from a generic template, then push them toghether to create a carousel
      if (msg.payload != null && validators.genericTemplateElements(msg.payload.elements)) {
        elements = _.union(elements, msg.payload.elements);
      }*/

      /*template(title, subtitle, imageUrl)
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
        */
    });
  }

  RED.nodes.registerType('chatbot-dialog', ChatBotDialog);
};
