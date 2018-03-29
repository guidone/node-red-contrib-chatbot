var MessageTemplate = require('../lib/message-template-async');
var utils = require('../lib/helpers/utils');
var _ = require('underscore');
var validators = require('../lib/helpers/validators');

module.exports = function(RED) {

  function ChatBotInvoice(config) {
    RED.nodes.createNode(this, config);
    var node = this;
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
    this.transports = ['telegram'];

    this.on('input', function(msg) {
      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }
      var chatId = utils.getChatId(msg);
      var template = MessageTemplate(msg, node);

      var title = utils.extractValue('string', 'title', node, msg, false);
      var description = utils.extractValue('string', 'description', node, msg, false);
      var currency = utils.extractValue('string', 'currency', node, msg, false);
      var payload = utils.extractValue('string', 'payload', node, msg, false);
      var needName = utils.extractValue('boolean', 'needName', node, msg, false);
      var needEmail = utils.extractValue('boolean', 'needEmail', node, msg, false);
      var needPhoneNumber = utils.extractValue('boolean', 'needPhoneNumber', node, msg, false);
      var needShippingAddress = utils.extractValue('boolean', 'needShippingAddress', node, msg, false);
      var isFlexible = utils.extractValue('boolean', 'isFlexible', node, msg, false);
      var prices = utils.extractValue('invoiceItems', 'prices', node, msg, false);

      // payload that can be translated
      var invoicePayload = {
        title: title,
        description: description,
        payload: payload,
        prices: prices
      };

      template(invoicePayload)
        .then(function(invoicePayload) {
          // check again, validation may insert wrong values
          if (!validators.invoiceItems(invoicePayload.prices)) {
            node.error('Invalid prices in Invoice node: ' + JSON.stringify(invoicePayload.prices));
            return;
          }
          // merge template
          _.extend(invoicePayload, {
            type: 'invoice',
            startParameter: 'start_parameter',
            currency: currency,
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

  RED.nodes.registerType('chatbot-invoice', ChatBotInvoice);
};
