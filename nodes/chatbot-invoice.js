const MessageTemplate = require('../lib/message-template-async');
const { flattenValidationErrors, extractValue, getChatId, matchTransport, getTransport } = require('../lib/helpers/utils');
const { ChatExpress } = require('chat-platform');
const _ = require('underscore');
const validators = require('../lib/helpers/validators');
const RegisterType = require('../lib/node-installer');
const lcd = require('../lib/helpers/lcd');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotInvoice(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.name = config.name;
    this.title = config.title;
    this.description = config.description;
    this.currency = config.currency;
    this.needName = config.needName;
    this.needEmail = config.needEmail;
    this.needPhoneNumber = config.needPhoneNumber;
    this.needShippingAddress = config.needShippingAddress;
    this.isFlexible = config.isFlexible;
    this.prices = config.prices;
    this.payload = config.payload;
    this.photoUrl = config.photoUrl;
    this.photoWidth = config.photoWidth;
    this.photoHeight = config.photoHeight;
    this.transports = ['telegram'];

    this.on('input', msg => {
      const chatId = getChatId(msg);
      const transport = getTransport(msg);

      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'message') && !matchTransport(node, msg)) {
        return;
      }

      const template = MessageTemplate(msg, node);

      const title = extractValue('string', 'title', node, msg, false);
      const description = extractValue('string', 'description', node, msg, false);
      const currency = extractValue('string', 'currency', node, msg, false);
      const payload = extractValue('string', 'payload', node, msg, false);
      const photoUrl = extractValue('string', 'photoUrl', node, msg, false);
      const photoWidth = extractValue('integer', 'photoWidth', node, msg, false)
        || extractValue('variable', 'photoWidth', node, msg, false);
      const photoHeight = extractValue('integer', 'photoHeight', node, msg, false)
        || extractValue('variable', 'photoHeight', node, msg, false);
      const needName = extractValue('boolean', 'needName', node, msg, false);
      const needEmail = extractValue('boolean', 'needEmail', node, msg, false);
      const needPhoneNumber = extractValue('boolean', 'needPhoneNumber', node, msg, false);
      const needShippingAddress = extractValue('boolean', 'needShippingAddress', node, msg, false);
      const isFlexible = extractValue('boolean', 'isFlexible', node, msg, false);
      const prices = extractValue('array', 'prices', node, msg, false);

      // payload that can be translated
      const invoicePayload = {
        title: title,
        description: description,
        payload: payload,
        prices: prices,
        photoUrl: photoUrl,
        photoHeight: photoHeight,
        photoWidth: photoWidth,
        currency: currency
      };

      template(invoicePayload)
        .then(invoicePayload => {
          invoicePayload.photoWidth = !_.isEmpty(invoicePayload.photoWidth) ? parseInt(invoicePayload.photoWidth, 10) : null;
          invoicePayload.photoHeight = !_.isEmpty(invoicePayload.photoHeight) ? parseInt(invoicePayload.photoHeight, 10) : null;
          // check again, validation may insert wrong values

          if (!validators.invoice(invoicePayload)) {
            const errors = validators.invoiceErrors(invoicePayload);
            lcd.node(errors, { title: 'Invalid invoice', node });
            node.error('Invalid invoice: ' + JSON.stringify(invoicePayload) + ' - ' + flattenValidationErrors(errors));
            return;
          }
          // merge template
          _.extend(invoicePayload, {
            type: 'invoice',
            startParameter: 'start_parameter',
            needName: needName,
            needPhoneNumber: needPhoneNumber,
            needEmail: needEmail,
            needShippingAddress: needShippingAddress,
            isFlexible: isFlexible,
            chatId: chatId
          });
          msg.payload = invoicePayload;
          node.send(msg);
        });
    });
  }

  registerType('chatbot-invoice', ChatBotInvoice);
};
