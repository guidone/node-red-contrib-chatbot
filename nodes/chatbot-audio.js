const _ = require('underscore');
const Path = require('path');
const sanitize = require('sanitize-filename');

const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const validators = require('../lib/helpers/validators');
const fetchers = require('../lib/helpers/fetchers-obj');
const { ChatExpress } = require('chat-platform');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotAudio(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    
    this.audio = config.audio;
    this.duration = config.duration;
    this.name = config.name;

    this.on('input', function(msg) {

      const name = node.name;
      const chatId = utils.getChatId(msg);
      const messageId = utils.getMessageId(msg);
      const transport = utils.getTransport(msg);

      // check if valid message
      if (!utils.isValidMessage(msg, node)) {
        return;
      }
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'audio')) {
        return;
      }

      let content = utils.extractValue('filepath', 'audio', node, msg)
        || utils.extractValue('buffer', 'audio', node, msg)
        || utils.extractValue('filepath', 'filename', node, msg, false, true); // no payload, yes message
      let caption = utils.extractValue('string', 'caption', node, msg, false);
      let duration = utils.extractValue('number', 'duration', node, msg);

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
        .then(file => {
          // check if a valid file
          const error = ChatExpress.isValidFile(transport, 'audio', file);
          if (error != null) { 
            node.error(error);
            throw error;
          }
          return file;
        })
        .then(file => {
          // if filename is still empty then try to use some info of the current node
          if (_.isEmpty(file.filename)) {
            if (!_.isEmpty(msg.filename)) {
              // try to get filename from a message if it comes from a node-red file node
              file.filename = Path.basename(msg.filename);
            } if (msg.payload != null && !_.isEmpty(msg.payload.filename)) {
              // try to get filename from a message if it comes from a node-red file node
              file.filename = Path.basename(msg.payload.filename);
            } else if (_.isString(msg.payload) && !_.isEmpty(msg.payload) && msg.payload.length < 256) {
              // use from payload, pay attention to huge text files
              file.filename = sanitize(msg.payload);
            } else if (!_.isEmpty(name)) {
              file.filename = sanitize(name);
            }
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
  }

  registerType('chatbot-audio', ChatBotAudio);
};
