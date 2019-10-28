const MessageTemplate = require('../lib/message-template-async');
const emoji = require('node-emoji');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

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
      var requestType = utils.extractValue('string', 'requestType', node, msg, false);
      var buttonLabel = utils.extractValue('string', 'buttonLabel', node, msg, false);
      var template = MessageTemplate(msg, node);

      template(message)
        .then(function(translated) {
          msg.payload = {
            type: 'request',
            requestType: requestType,
            label: buttonLabel,
            chatId: chatId,
            messageId: messageId,
            content: emoji.emojify(translated)
          };
          node.send(msg);
        });
    });
  }

  registerType('chatbot-request', ChatBotRequest);
};
