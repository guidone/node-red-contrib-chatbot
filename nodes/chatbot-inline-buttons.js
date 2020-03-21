const MessageTemplate = require('../lib/message-template-async');
const emoji = require('node-emoji');

const utils = require('../lib/helpers/utils');
const { ChatExpress } = require('chat-platform');
const RegisterType = require('../lib/node-installer');
const {
  isValidMessage,
  getChatId,
  getMessageId,
  extractValue
} = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotInlineButtons(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.name = config.name;
    this.buttons = config.buttons;
    this.message = config.message;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      var transport = utils.getTransport(msg);

      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'inline-buttons') && !utils.matchTransport(node, msg)) {
        return;
      }

      const chatId = getChatId(msg);
      const messageId = getMessageId(msg);
      const template = MessageTemplate(msg, node);

      // prepare buttons, first the config, then payload
      const buttons = extractValue('buttons', 'buttons', node, msg);
      const message = extractValue('string', 'message', node, msg);
      const name = extractValue('string', 'name', node, msg);

      template(message, buttons)
        .then(([message, buttons]) => {
          console.log('risultato --', buttons)
          send({
            ...msg,
            payload: {
              type: 'inline-buttons',
              name,
              content: message != null ? emoji.emojify(message) : null,
              chatId,
              messageId,
              buttons
            }
          });
          done();
        });
    });

  }

  registerType('chatbot-inline-buttons', ChatBotInlineButtons);
};
