const MessageTemplate = require('../lib/message-template-async');
const utils = require('../lib/helpers/utils');
const _ = require('underscore');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotInvoiceShipping(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.name = config.name;
    this.shippingOptions = config.shippingOptions;
    this.transports = ['telegram'];

    this.on('input', function(msg) {
      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }
      var template = MessageTemplate(msg, node);
      var shippingOptions = utils.extractValue('shippingOptions', 'shippingOptions', node, msg, true);
      var shippingQueryId = msg.payload != null ? msg.payload.shippingQueryId : null;

      if (_.isEmpty(shippingQueryId)) {
        node.error('shippingQueryId is null in payload, use Invoice Shipping in aswer to a "invoice-shipping" message');
        return;
      }

      template(shippingOptions)
        .then(function(shippingOptions) {
          msg.payload = {
            type: 'invoice-shipping',
            shippingQueryId: shippingQueryId,
            shippingOptions: shippingOptions
          };
          node.send(msg);
        });
    });
  }

  registerType('chatbot-invoice-shipping', ChatBotInvoiceShipping);
};
