const _ = require('underscore');
const fs = require('fs');
const Path = require('path');
const utils = require('../lib/helpers/utils');
const sanitize = require('sanitize-filename');
const mime = require('mime');
const { ChatExpress } = require('chat-platform');

const BufferTransformers = require('../lib/buffer-transformers');
const RegisterType = require('../lib/node-installer');
const validators = require('../lib/helpers/validators');
const fetchers = require('../lib/helpers/fetchers-obj');


const ValidExtensions = {
  'facebook': ['.pdf', '.png', '.jpg', '.zip', '.gif'],
  'telegram': ['.pdf', '.gif', '.zip'],
  'slack': ['.pdf', '.zip'],
  'viber': ['*']
};


module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotDocument(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.filename = config.filename;
    this.document = config.document;
    this.name = config.name;
    this.caption = config.caption;
    this.transports = ['telegram', 'facebook', 'slack', 'viber'];

    // TODO: remove this handler
    this.on('input2', function(msg) {

      //var path = node.filename;
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
      } else if (msg.payload != null && !_.isEmpty(msg.payload.path)) {
        path = msg.payload.path;
      }

      if (!_.isEmpty(path)) {
        if (!fs.existsSync(path)) {
          node.error('File doesn\'t exist: ' + path);
          return;
        }
        file = {
          filename: Path.basename(path),
          buffer: fs.readFileSync(path),
          mimeType: mime.lookup(path),
          extension: Path.extname(path)
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
        // handle a buffer passed by another document node
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
      }
      // exit if no file description
      if (file == null) {
        node.error('Unable to find a file in the input message.');
        return;
      }
      // get caption
      var caption = null;
      if (!_.isEmpty(node.caption)) {
        caption = node.caption;
      } else if (_.isObject(msg.payload) && _.isString(msg.payload.caption) && !_.isEmpty(msg.payload.caption)) {
        caption = msg.payload.caption;
      }
      // if the file has a not accepted extension, then zip it
      var transform = BufferTransformers.identity;
      if (!_(validExtensions).contains('*') && !_(validExtensions).contains(file.extension)) {
        transform = BufferTransformers.zip
      }
      // zip the file if needed or leave it as is
      transform(file)
        .then(function(newFile) {
          // send out the message
          msg.payload = {
            type: 'document',
            content: newFile.buffer,
            filename: newFile.filename,
            caption: caption,
            chatId: chatId,
            messageId: messageId,
            inbound: false,
            mimeType: newFile.mimeType
          };
          // send out reply
          node.send(msg);
        });
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
      if (!ChatExpress.isSupported(transport, 'document') && !utils.matchTransport(node, msg)) {
        return;
      }

      let content = utils.extractValue('filepath', 'document', node, msg)
        || utils.extractValue('url', 'document', node, msg)
        || utils.extractValue('buffer', 'document', node, msg)
        || utils.extractValue('filepath', 'filename', node, msg, false, true); // no payload, yes message
      let caption = utils.extractValue('string', 'caption', node, msg, false);
      

      // TODO: move the validate audio file to chat platform methods

      // get the content
      let fetcher = null;
      if (validators.filepath(content)) {
        fetcher = fetchers.file;
      } else if (validators.url(content)) {
        console.log('url fetcher')
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
        // TODO: add here size check
        .then(file => {
          // if the file has a not accepted extension, then zip it      
          if (!_(validExtensions).contains('*') && !_(validExtensions).contains(file.extension)) {
            return BufferTransformers.zip(file);
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
                type: 'document',
                content: file.buffer,
                caption,
                filename: file.filename,
                mimeType: file.mimeType,
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

  registerType('chatbot-document', ChatBotDocument);
};
