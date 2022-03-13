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

  function ChatBotMessengerTemplate(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.name = config.name;
    this.templateType = config.templateType;
    this.text = config.text;
    this.json = config.json;
    this.buttons = config.buttons;
    this.title = config.title;
    this.subtitle = config.subtitle;
    this.imageUrl = config.imageUrl;
    this.mediaUrl = config.mediaUrl;
    this.mediaType = config.mediaType;
    this.attachmentId = config.attachmentId;
    this.productId = config.productId;

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
      if (!ChatExpress.isSupported(transport, 'template')) {
        done(`Node "template" is not supported by ${transport} transport`);
        return;
      }
      // get values from config
      const buttons = extractValue('buttons', 'buttons', node, msg);
      const title = extractValue('string', 'title', node, msg);
      let templateType = extractValue('string', 'templateType', node, msg);
      const text = extractValue('string', 'text', node, msg);
      const json = extractValue(['string', 'hash'], 'json', node, msg);
      const subtitle = extractValue('string', 'subtitle', node, msg);
      const imageUrl = extractValue('string', 'imageUrl', node, msg);
      const mediaUrl = extractValue('string', 'mediaUrl', node, msg);
      const mediaType = extractValue('string', 'mediaType', node, msg);
      const attachmentId = extractValue('string', 'attachmentId', node, msg);
      const productId = extractValue('string', 'productId', node, msg);
      let elements = extractValue('arrayOfFacebookTemplateElements', 'elements', node, msg);

      elements = elements != null ? elements : [];

      // infer the templateType from a list of elements defined upstream
      if (!_.isEmpty(elements) && ['generic', 'product'].includes(elements[0].templateType)
      ) {
        templateType = elements[0].templateType;
      }
      //let elements = [];
      let payload;
      // if inbound is another message from a generic template, then push them toghether to create a carousel
      if (msg.payload != null && msg.payload.type === 'template') {
        if (msg.payload.templateType === 'generic') {
          if (validators.genericTemplateElements(msg.payload.elements)) {
            elements = _.union(elements, msg.payload.elements);
          } else {
            done('Some element in the generic template is not valid');
            return;
          }
        } else if (msg.payload.templateType === 'product') {
          if (validators.productTemplateElements(msg.payload.elements)) {
            elements = _.union(elements, msg.payload.elements);
          } else {
            done('Some element in the product template is not valid');
            return;
          }
        } else {
          done('It\'s not possible to combine different template types');
          return;
        }
      }
      const translated = await template({ title, subtitle, imageUrl, mediaUrl, mediaType, attachmentId, productId, buttons, text });
      // add the current one if not empty
      let jsonPayload;
      if (_.isString(json)) {
        try {
          jsonPayload = JSON.parse(json);
        } catch(e) {
          done('Invalid JSON in Messenger template');
          return;
        }
      } else {
        jsonPayload = json;
      }

      switch (templateType) {
        case 'generic':
          // skip if empty
          if (!_.isEmpty(title)) {
            elements.push({
              title: translated.title,
              subtitle: translated.subtitle,
              imageUrl: translated.imageUrl,
              buttons: translated.buttons
            });
          }
        break;
        case 'button':
          payload = {
            text: translated.text,
            buttons: translated.buttons
          };
          break;
        case 'customer_feedback':
        case 'receipt':
          payload = {
            json: jsonPayload
          };
          break;
        case 'media':
          payload = {
            mediaUrl: translated.mediaUrl,
            mediaType: translated.mediaType,
            attachmentId: translated.attachmentId
          };
          break;
        case 'product':
          // skip if empty
          if (!_.isEmpty(translated.productId)) {
            elements.push({
              id: translated.productId
            });
          }
          break;
      }

      send({
        ...msg,
        payload: {
          type: 'template',
          templateType,
          ...payload,
          elements,
          chatId,
          messageId
        }
      })
      done();
    });
  }

  registerType('chatbot-messenger-template', ChatBotMessengerTemplate);
};
