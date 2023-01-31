const emoji = require('node-emoji');
const _ = require('underscore');
const { ChatExpress } = require('chat-platform');

const MessageTemplate = require('../lib/message-template-async');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

const {
  isValidMessage,
  getChatId,
  getMessageId,
  getTransport,
  extractValue,
  appendPayload
} = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotAsk(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    globalContextHelper.init(this.context().global);
    this.buttons = config.buttons;
    this.message = config.message;
    this.isPersistent = config.isPersistent;
    this.oneTimeKeyboard = config.oneTimeKeyboard;
    this.placeholder = config.placeholder;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      const sendPayload = appendPayload(send, msg);
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      // get config
      const chatId = getChatId(msg);
      const messageId = getMessageId(msg);
      const transport = getTransport(msg);
      const template = MessageTemplate(msg, node);
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'telegram-buttons')) {
        done(`Node "Buttons" is not supported by ${transport} transport`);
        return;
      }

      const buttons = extractValue('buttons', 'buttons', node, msg, true);
      const message = extractValue('string', 'message', node, msg, false);
      const isPersistent = extractValue('boolean', 'isPersistent', node, msg, true);
      const oneTimeKeyboard = extractValue('boolean', 'oneTimeKeyboard', node, msg, true);
      const placeholder = extractValue('string', 'placeholder', node, msg, true);

      // template then send
      template(message)
        .then(function(translated) {
          sendPayload({
            type: _.isEmpty(buttons) ? 'telegram-reset-buttons': 'telegram-buttons',
            content: message != null ? emoji.emojify(translated) : null,
            chatId: chatId,
            messageId: messageId,
            buttons: buttons,
            isPersistent,
            oneTimeKeyboard,
            placeholder
          });
        });
    });
  }

  registerType('chatbot-ask', ChatBotAsk);
};
