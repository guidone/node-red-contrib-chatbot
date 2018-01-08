var _ = require('underscore');
var MessageTemplate = require('../lib/message-template.js');
var utils = require('../lib/helpers/utils');
var validators = require('../lib/helpers/validators');

module.exports = function(RED) {

  function ChatBotListTemplate(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.name = config.name;
    this.buttons = config.buttons;
    this.title = config.title;
    this.subtitle = config.subtitle;
    this.imageUrl = config.imageUrl;
    //this.aspectRatio = config.aspectRatio;
    this.topElementStyle = config.topElementStyle;
    this.sharable = config.sharable;
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
      var topElementStyle = utils.extractValue('string', 'topElementStyle', node, msg);
      var sharable = utils.extractValue('boolean', 'sharable', node, msg);

      var elements = [];
      var globalButtons = null;
      // if inbound is another message from a generic template, then push them toghether to create a carousel
      if (msg.payload != null && validators.genericTemplateElements(msg.payload.elements)) {
        elements = _.union(elements, msg.payload.elements);
      }
      // add the current one if the title is null, otherwise se it as global button
      if (!_.isEmpty(title)) {
        var element = {
          title: template(title),
          subtitle: template(subtitle),
          imageUrl: template(imageUrl),
          buttons: buttons.length !== 0 ? [buttons[0]] : null // only 1 button allowed
        };
        // add the first "url" type button as default_action
        var defaultAction = _(buttons).findWhere({type: 'url'});
        if (defaultAction != null) {
          element.default_action = _.extend({}, defaultAction, {type: 'web_url'});
        }
        elements.push(element);
      } else if (_.isArray(buttons) && !_.isEmpty(buttons)) {
        globalButtons = [buttons[0]]; // only 1 button allowed
      } // else do nothing, only elements from upstream nodes

      msg.payload = {
        type: 'list-template',
        topElementStyle: !_.isEmpty(topElementStyle) ? topElementStyle : 'large',
        sharable: _.isBoolean(sharable) ? sharable : true,
        elements: elements,
        chatId: chatId,
        messageId: messageId,
        globalButtons: globalButtons
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-list-template', ChatBotListTemplate);
};
