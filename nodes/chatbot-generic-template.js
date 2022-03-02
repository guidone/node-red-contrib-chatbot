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
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotGenericTemplate(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.name = config.name;
    this.buttons = config.buttons;
    this.title = config.title;
    this.subtitle = config.subtitle;
    this.imageUrl = config.imageUrl;
    this.aspectRatio = config.aspectRatio;
    this.sharable = config.sharable;
    this.transports = ['facebook', 'slack'];

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
      if (!ChatExpress.isSupported(transport, 'generic-template')) {
        done(`Node "generic-template" is not supported by ${transport} transport`);
        return;
      }
      // get values from config
      const buttons = extractValue('buttons', 'buttons', node, msg);
      const title = extractValue('string', 'title', node, msg);
      const subtitle = extractValue('string', 'subtitle', node, msg);
      const imageUrl = extractValue('string', 'imageUrl', node, msg);
      const aspectRatio = extractValue('string', 'aspectRatio', node, msg);
      const sharable = extractValue('boolean', 'sharable', node, msg);

      let elements = [];
      // if inbound is another message from a generic template, then push them toghether to create a carousel
      if (msg.payload != null && validators.genericTemplateElements(msg.payload.elements)) {
        elements = _.union(elements, msg.payload.elements);
      }

      const translated = await template({ title, subtitle, imageUrl, buttons });

      // add the current one if not empty
      elements.push({
        title: translated.title,
        subtitle: translated.subtitle,
        imageUrl: translated.imageUrl,
        buttons: translated.buttons
      });

      send({
        ...msg,
        payload: {
          type: 'generic-template',
          aspectRatio: !_.isEmpty(aspectRatio) ? aspectRatio : 'horizontal',
          sharable: _.isBoolean(sharable) ? sharable : true,
          elements: elements,
          chatId: chatId,
          messageId: messageId
        }
      })
      done();
    });
  }

  registerType('chatbot-generic-template', ChatBotGenericTemplate);
};
