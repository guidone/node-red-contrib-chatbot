const _ = require('underscore');
const { ChatExpress } = require('chat-platform');

const MessageTemplate = require('../lib/message-template-async');
const RegisterType = require('../lib/node-installer');
const validators = require('../lib/helpers/validators');
const fetchers = require('../lib/helpers/fetchers-obj');
const { 
  enrichFilePayload, 
  isValidMessage, 
  getChatId, 
  getMessageId, 
  getTransport, 
  extractValue 
} = require('../lib/helpers/utils');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotAudio(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    globalContextHelper.init(this.context().global);
    this.audio = config.audio;
    this.duration = config.duration;
    this.caption = config.caption;
    this.name = config.name;

    this.on('input', function(msg) {
      const chatId = getChatId(msg);
      const messageId = getMessageId(msg);
      const transport = getTransport(msg);
      const template = MessageTemplate(msg, node);

      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'audio')) {
        return;
      }

      let content = extractValue('filepath', 'audio', node, msg)
        || extractValue('buffer', 'audio', node, msg)
        || extractValue('stringWithVariables', 'audio', node, msg)
        || extractValue('filepath', 'filename', node, msg, false, true, false); // no payload, yes message
      let caption = extractValue('string', 'caption', node, msg, false);
      let duration = extractValue('number', 'duration', node, msg);

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
              const error = ChatExpress.isValidFile(transport, 'audio', file);
              if (error != null) { 
                node.error(error);
                throw error;
              }
              return file;
            })
            .then(
              file => {
                // send out reply
                node.send({
                  ...msg,
                  payload: {
                    type: 'audio',
                    content: file.buffer,
                    caption,
                    duration,
                    filename: file.filename,
                    chatId: chatId,
                    messageId: messageId,
                    inbound: false
                  }
                });
              },
              node.error
            );
        });
    });
  }

  registerType('chatbot-audio', ChatBotAudio);
};
