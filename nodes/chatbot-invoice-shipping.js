var MessageTemplate = require('../lib/message-template-async');
var utils = require('../lib/helpers/utils');
var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotInvoiceShipping(config) {
    RED.nodes.createNode(this, config);
    var node = this;
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



      /*var shippingPayload = {
        shippingQueryId: msg.payload.shippingQueryId,
        type: 'invoice-shipping',
        shippingOptions: shippingOptions
        /*shippingOptions: [
          {
            id: 'fedex',
            title: 'Fedex Express',
            prices: [
              { label: 'Uno', amount: 100},
            ]
          },
          {
            id: 'cacchez',
            title: 'Cacchez Express',
            prices: [
              { label: 'UnoUno', amount: 100},
              { label: 'DueDue', amount: 200}
            ]
          }
        ]*/

      //};

      template(shippingOptions)
        .then(function(shippingOptions) {
          msg.payload = {
            type: 'invoice-shipping',
            shippingQueryId: msg.payload.shippingQueryId,
            shippingOptions: shippingOptions
          };
          node.send(msg);
        });
    });
  }

  RED.nodes.registerType('chatbot-invoice-shipping', ChatBotInvoiceShipping);
};
