var MessageTemplate = require('../lib/message-template-async');
var emoji = require('node-emoji');
var utils = require('../lib/helpers/utils');


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

      template('test')
        .then(function(message) {
          msg.payload = {
            type: 'invoice',
            title: title,
            description: description,
            startParameter: 'start_parameter',
            currency: currency,
            payload: payload,
            prices: [
              {label: 'Uno', amount: 125},
              {label: 'Due', amount: 300}
            ],
            needName: needName,
            needPhoneNumber: needPhoneNumber,
            needEmail: needEmail,
            needShippingAddress: needShippingAddress,
            isFlexible: isFlexible,
            chatId: chatId
          };
          node.send(msg);
        });
    });

  }

  RED.nodes.registerType('chatbot-invoice', ChatBotInvoice);
};
