const _ = require('underscore');
const fs = require('fs');
const Path = require('path');
const sanitize = require('sanitize-filename');
const mime = require('mime');
const { ChatExpress } = require('chat-platform');

const validators = require('../lib/helpers/validators');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const fetchers = require('../lib/helpers/fetchers-obj');

const ValidExtensions = {
  'facebook': ['.mp4'],
  'telegram': ['.mp4'],
  'slack': ['.mp4']
};

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotVideo(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.filename = config.filename;
    this.name = config.name;
    this.caption = config.caption;
    this.transports = ['facebook', 'telegram', 'slack'];

    // TODO: remove this
    this.on('input2', function(msg) {

      var name = node.name;
      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var transport = utils.getTransport(msg);
      var validExtensions = ValidExtensions[transport];
      var file = null;

      // check if valid message
      if (!utils.isValidMessage(msg, node)) {
        return;
      }
      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var defaultFilename = null;
      if (!_.isEmpty(msg.filename)) {
        defaultFilename = msg.filename;
      } else if (!_.isEmpty(name)) {
        defaultFilename = sanitize(name);
      } else if (msg.payload != null && !_.isEmpty(msg.payload.filename)) {
        defaultFilename = msg.payload.filename;
      } else if (msg.payload != null && !_.isEmpty(msg.filename)) {
        defaultFilename = msg.filename;
      }

      var path = null;
      if (!_.isEmpty(node.filename)) {
        path = node.filename;
      } else if (!_.isEmpty(msg.filename)) {
        path = msg.filename;
      }

      if (!_.isEmpty(path)) {
        if (!fs.existsSync(path)) {
          node.error('File doesn\'t exist: ' + path);
          return;
        }
        file = {
          filename: Path.basename(path),
          extension: Path.extname(path),
          mimeType: mime.lookup(path),
          buffer: fs.readFileSync(path)
        };
      } else if (msg.payload instanceof Buffer) {
        // handle a file buffer passed through payload
        if (_.isEmpty(defaultFilename) || _.isEmpty(Path.extname(defaultFilename))) {
          node.error('Unknown file type, use the "name" parameter to specify the file name and extension as default');
          return;
        }
        file = {
          filename: Path.basename(defaultFilename),
          extension: Path.extname(defaultFilename),
          mimeType: mime.lookup(defaultFilename),
          buffer: msg.payload
        };
      } else if (_.isObject(msg.payload) && msg.payload.file instanceof Buffer) {
        // handle a buffer passed by another video node
        if (_.isEmpty(defaultFilename) || _.isEmpty(Path.extname(defaultFilename))) {
          node.error('Unknown file type, use the "name" parameter to specify the file name and extension as default');
          return;
        }
        file = {
          filename: Path.basename(defaultFilename),
          extension: Path.extname(defaultFilename),
          mimeType: mime.lookup(defaultFilename),
          buffer: msg.payload.file
        };
      } else {
        node.error('Unable to find a video in the input message.');
        return;
      }

      // get caption
      var caption = null;
      if (!_.isEmpty(node.caption)) {
        caption = node.caption;
      } else if (_.isObject(msg.payload) && _.isString(msg.payload.caption) && !_.isEmpty(msg.payload.caption)) {
        caption = msg.payload.caption;
      }

      // if the file has a not a valid extension, stop it
      if (!_(validExtensions).contains(file.extension)) {
        node.error('Unsupported file format for video node, allowed formats: ' + validExtensions.join(', '));
        return;
      }

      // send out the message
      msg.payload = {
        type: 'video',
        content: file.buffer,
        filename: file.filename,
        caption: caption,
        chatId: chatId,
        messageId: messageId,
        inbound: false,
        mimeType: file.mimeType
      };
      // send out reply
      node.send(msg);

    });

    this.on('input', function(msg) {

      const name = node.name;
      const chatId = utils.getChatId(msg);
      const messageId = utils.getMessageId(msg);
      const transport = utils.getTransport(msg);
      const validExtensions = ValidExtensions[transport];
  
      // check if valid message
      if (!utils.isValidMessage(msg, node)) {
        return;
      }
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'video') && !utils.matchTransport(node, msg)) {
        return;
      }
  
      let content = utils.extractValue('filepath', 'video', node, msg)
        || utils.extractValue('buffer', 'video', node, msg)
        || utils.extractValue('filepath', 'filename', node, msg, false, true); // no payload, yes message
      let caption = utils.extractValue('string', 'caption', node, msg, false);
      
  
      // TODO: move the validate audio file to chat platform methods
  
      // get the content
      let fetcher = null;
      if (validators.filepath(content)) {
        fetcher = fetchers.file;
      } else if (validators.url(content)) {
        fetcher = fetchers.url;
      } else if (validators.buffer(content)) {
        fetcher = fetchers.identity;
      } else if (_.isString(content) && content.length > 4064) {
        node.error('Looks like you are passing a very long string (> 4064 bytes) in the payload as video url or path\n'
          + 'Perhaps you are using a "Http request" and passing the result as string instead of buffer?');
        return;
      } else {
        node.error('Don\'t know how to handle: ' + content);
        return;
      }
  
      fetcher(content)
        // TODO: add here size check
        .then(file => {
          // if the file has a not a valid extension, stop it
          if (!_.isEmpty(file.extension) && !_(validExtensions).contains(file.extension)) {
            const error = 'Unsupported file format for video node, allowed formats: ' + validExtensions.join(', '); 
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
            console.log('--->', file)
            // send out reply
            node.send({
              ...msg,
              payload: {
                type: 'video',
                content: file.buffer,
                caption,            
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

  registerType('chatbot-video', ChatBotVideo);
};
