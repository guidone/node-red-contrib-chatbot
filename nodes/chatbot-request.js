var MessageTemplate = require('../lib/message-template.js');
var emoji = require('node-emoji');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotRequest(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.buttonLabel = config.buttonLabel;
    this.requestType = config.requestType;
    this.transports = ['telegram', 'facebook'];

    this.on('input', function(msg) {

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);

      var message = utils.extractValue('string', 'message', node, msg);
      var requestType = utils.extractValue('string', 'requestType', node, msg);
      var buttonLabel = utils.extractValue('string', 'buttonLabel', node, msg);
      var template = MessageTemplate(msg, node);

      msg.payload = {
        type: 'request',
        requestType: requestType,
        label: buttonLabel,
        chatId: chatId,
        messageId: messageId,
        content: emoji.emojify(template(message))
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-request', ChatBotRequest);
};
