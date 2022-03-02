const _ = require('underscore');
const { ChatExpress } = require('chat-platform');

const MessageTemplate = require('../lib/message-template-async');
const BufferTransformers = require('../lib/buffer-transformers');
const RegisterType = require('../lib/node-installer');
const validators = require('../lib/helpers/validators');
const fetchers = require('../lib/helpers/fetchers-obj');
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

  function ChatBotDocument(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    globalContextHelper.init(this.context().global);
    this.filename = config.filename;
    this.document = config.document;
    this.name = config.name;
    this.caption = config.caption;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      const sendPayload = appendPayload(send, msg);
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      const chatId = getChatId(msg);
      const messageId = getMessageId(msg);
      const transport = getTransport(msg);
      const template = MessageTemplate(msg, node);
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'document')) {
        return;
      }

      let content = extractValue('filepath', 'document', node, msg, true, true, true)
        || extractValue('stringWithVariables', 'document', node, msg, true, true, true)
        || extractValue('url', 'document', node, msg, true, true, true)
        || extractValue('buffer', 'document', node, msg, true, true, true)
        || extractValue('filepath', 'filename', node, msg, false, true, false); // no payload, yes message
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
            node.error('Looks like you are passing a very long string (> 4064 bytes) in the payload as document url or path\n'
              + 'Perhaps you are using a "Http request" and passing the result as string instead of buffer?');
            return;
          } else {
            node.error('Don\'t know how to handle: ' + content);
            return;
          }

          fetcher(content)
            .then(file => enrichFilePayload(file, msg, node))
            .then(file => {
              // check if a valid file and zip it if not right extension
              const error = ChatExpress.isValidFile(transport, 'document', file);
              if (error != null && _.isString(error) && error.includes('Unsupported file format')) {
                return BufferTransformers.zip(file);
              } else if (error != null) {
                done(error);
                throw error;
              }
              return file;
            })

            .then(
              file => {
                // send out reply
                sendPayload({
                  type: 'document',
                  content: file.buffer,
                  caption,
                  filename: file.filename,
                  mimeType: file.mimeType,
                  chatId: chatId,
                  messageId: messageId,
                  inbound: false
                });
                done();
              },
              node.error
            );
        });
    });
  }

  registerType('chatbot-document', ChatBotDocument);
};
