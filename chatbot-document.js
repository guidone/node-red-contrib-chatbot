var _ = require('underscore');
var fs = require('fs');
var Path = require('path');
var utils = require('./lib/helpers/utils');
var sanitize = require("sanitize-filename");
var mime = require('mime');
var BufferTransformers = require('./lib/buffer-transformers');

var ValidExtensions = {
  'facebook': ['.pdf', '.png', '.jpg', '.zip', '.gif'],
  'telegram': ['.pdf', '.gif', '.zip']
};


module.exports = function(RED) {

  function ChatBotDocument(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.filename = config.filename;
    this.name = config.name;
    this.caption = config.caption;
    this.transports = ['telegram', 'facebook'];

    this.on('input', function(msg) {

      var path = node.filename;
      var name = node.name;
      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var transport = utils.getTransport(msg);
      var validExtensions = ValidExtensions[transport];
      var content = null;
      var file = null;

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      if (!_.isEmpty(path)) {
        file = {
          filename: Path.basename(path),
          buffer: fs.readFileSync(path),
          mimeType: mime.lookup(path),
          extension: Path.extname(path)
        };
      } else if (msg.payload instanceof Buffer) {
        // handle a file buffer passed through payload
        // todo what happens if mimetype is null
        file = {
          filename: sanitize(name),
          buffer: msg.payload,
          extension: Path.extname(path)
        };
        // todo what if no image
      } else if (_.isObject(msg.payload) && msg.payload.file instanceof Buffer) {
        content = msg.payload.file;
        // todo zip it?
      }

      var caption = null;
      if (!_.isEmpty(node.caption)) {
        caption = node.caption;
      } else if (_.isObject(msg.payload) && _.isString(msg.payload.caption) && !_.isEmpty(msg.payload.caption)) {
        caption = msg.payload.caption;
      }

      // if the file has a not accepted extension, then zip it
      var transform = BufferTransformers.identity;
      if (!_(validExtensions).contains(file.extension)) {
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

  RED.nodes.registerType('chatbot-document', ChatBotDocument);
};
