const _ = require('underscore');
const fs = require('fs');
const Path = require('path');
const utils = require('../lib/helpers/utils');
const sanitize = require('sanitize-filename');
const mime = require('mime');
const BufferTransformers = require('../lib/buffer-transformers');
const RegisterType = require('../lib/node-installer');

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
    var node = this;
    this.filename = config.filename;
    this.name = config.name;
    this.caption = config.caption;
    this.transports = ['telegram', 'facebook', 'slack', 'viber'];

    this.on('input', function(msg) {

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
  }

  registerType('chatbot-document', ChatBotDocument);
};
