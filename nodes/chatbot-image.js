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

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotImage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.image = config.image;
    this.name = config.name;
    this.caption = config.caption;
    this.filename = config.filename; // for retrocompatibility

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
      if (!ChatExpress.isSupported(transport, 'photo')) {
        done(`Node "photo" is not supported by ${transport} transport`);
        return;
      }

      let content = extractValue('string', 'image', node, msg)
        || extractValue('buffer', 'image', node, msg)
        || extractValue('stringWithVariables', 'image', node, msg)
        || extractValue('string', 'filename', node, msg, false, true, false); // for retrocompatibility
      let caption = extractValue('string', 'caption', node, msg, false);

      template({ content, caption })
        .then(({ content, caption }) => {
          // get the content
          let fetcher = null;
          if (validators.filepath(content)) {
            fetcher = fetchers.file;
          } else if (validators.url(content)) {
            fetcher = fetchers.url;
          } else if (validators.buffer(content)) {
            fetcher = fetchers.identity;
          } else if (_.isString(content) && content.length > 4064) {
            node.error('Looks like you are passing a very long string (> 4064 bytes) in the payload as image url or path\n'
              + 'Perhaps you are using a "Http request" and passing the result as string instead of buffer?');
            return;
          } else {
            node.error('Don\'t know how to handle: ' + content);
            return;
          }

          fetcher(content)
            .then(file => enrichFilePayload(file, msg, node))
            .then(file => {
              // check if a valid file
              const error = ChatExpress.isValidFile(transport, 'photo', file);
              if (error != null) {
                node.error(error);
                throw error;
              }
              return file;
            })
            .then(
              file => {
                // send out the message
                sendPayload({
                  type: 'photo',
                  content: file.buffer,
                  filename: file.filename,
                  mimeType: file.mimeType,
                  caption: caption,
                  chatId: chatId,
                  messageId: messageId,
                  inbound: false
                });
              },
              node.error
            );
        });
    });
  }

  registerType('chatbot-image', ChatBotImage);
};
