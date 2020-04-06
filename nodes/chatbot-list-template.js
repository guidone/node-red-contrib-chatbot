const _ = require('underscore');
const MessageTemplate = require('../lib/message-template-async');
const validators = require('../lib/helpers/validators');
const RegisterType = require('../lib/node-installer');
const { ChatExpress } = require('chat-platform');
const {
  isValidMessage,
  getChatId,
  getMessageId,
  getTransport,
  extractValue
} = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotListTemplate(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.name = config.name;
    this.buttons = config.buttons;
    this.title = config.title;
    this.subtitle = config.subtitle;
    this.imageUrl = config.imageUrl;
    this.topElementStyle = config.topElementStyle;
    this.sharable = config.sharable;
    this.transports = ['facebook'];

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      const chatId = getChatId(msg);
      const messageId = getMessageId(msg);
      const template = MessageTemplate(msg, node);
      const transport = getTransport(msg);
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'list-template')) {
        done(`Node "list-template" is not supported by ${transport} transport`);
        return;
      }
      // get values from config
      const buttons = extractValue('buttons', 'buttons', node, msg);
      const title = extractValue('string', 'title', node, msg);
      const subtitle = extractValue('string', 'subtitle', node, msg);
      const imageUrl = extractValue('string', 'imageUrl', node, msg);
      const topElementStyle = extractValue('string', 'topElementStyle', node, msg);
      const sharable = extractValue('boolean', 'sharable', node, msg);

      let elements = [];
      let globalButtons = null;
      // if inbound is another message from a generic template, then push them toghether to create a carousel
      if (msg.payload != null && validators.genericTemplateElements(msg.payload.elements)) {
        elements = _.union(elements, msg.payload.elements);
      }
      // add the current one if the title is null, otherwise se it as global button
      if (!_.isEmpty(title)) {
        const element = {
          title,
          subtitle,
          imageUrl,
          buttons: buttons.length !== 0 ? [buttons[0]] : null // only 1 button allowed
        };
        // add the first "url" type button as default_action
        const defaultAction = buttons.find(button => button.type === 'url');
        if (defaultAction != null) {
          //element.default_action = _.extend({}, defaultAction, { type: 'web_url' });
          element.default_action = defaultAction;
        }
        elements.push(await template(element));
      } else if (_.isArray(buttons) && !_.isEmpty(buttons)) {
        globalButtons = await template([buttons[0]]); // only 1 button allowed
      } // else do nothing, only elements from upstream nodes

      node.send({
        ...msg,
        payload: {
          type: 'list-template',
          topElementStyle: !_.isEmpty(topElementStyle) ? topElementStyle : 'large',
          sharable: _.isBoolean(sharable) ? sharable : true,
          elements,
          chatId,
          messageId,
          globalButtons
        }
      });
      done();
    });
  }

  registerType('chatbot-list-template', ChatBotListTemplate);
};
