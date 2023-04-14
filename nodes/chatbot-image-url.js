const _ = require('underscore');

const MessageTemplate = require('../lib/message-template-async');
const fetchers = require('../lib/helpers/fetchers-obj');
const validators = require('../lib/helpers/validators');
const { ChatExpress } = require('chat-platform');
const RegisterType = require('../lib/node-installer');
const {
  enrichFilePayload,
  isValidMessage,
  getChatId,
  getMessageId,
  getTransport,
  extractValue,
  appendPayload
} = require('../lib/helpers/utils');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function (RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotImageURL(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.image = config.image;
    this.name = config.name;
    this.caption = config.caption;
    this.filename = config.filename; // for retrocompatibility

    this.on('input', function (msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function () { node.send.apply(node, arguments) };
      done = done || function (error) { node.error.call(node, error, msg) };
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
      if (!ChatExpress.isSupported(transport, 'photo-url')) {
        done(`Node "photo-url" is not supported by ${transport} transport`);
        return;
      }

      let content = extractValue('string', 'image', node, msg)
        || extractValue('stringWithVariables', 'image', node, msg)
      let caption = extractValue('string', 'caption', node, msg, false);

      template({ content, caption })
        .then(({ content, caption }) => {
          sendPayload({
            type: 'photo-url',
            content: content,
            caption: caption,
            chatId: chatId,
            messageId: messageId,
            inbound: false
          });
        });
    });
  }

  registerType('chatbot-image-url', ChatBotImageURL);
};
