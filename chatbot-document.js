var _ = require('underscore');
var fs = require('fs');
var Path = require('path');
var utils = require('./lib/helpers/utils');
var sanitize = require('sanitize-filename');
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

      var defaultFilename = null;
      if (!_.isEmpty(msg.filename)) {
        defaultFilename = msg.filename;
      } else if (!_.isEmpty(name)) {
        defaultFilename = sanitize(name);
      } else if (msg.payload != null && !_.isEmpty(msg.payload.filename)) {
        defaultFilename = msg.payload.filename;
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
        //var filename = !_.isEmpty(msg.filename) ? filename : (sanitize(name) )
        if (_.isEmpty(defaultFilename) || _.isEmpty(Path.extname(defaultFilename))) {
          node.error('Unknown filetype, use the "name" parameter to specify the file name and extension as default');
          return;
        }
        file = {
          filename: Path.basename(defaultFilename),
          extension: Path.extname(defaultFilename),
          mimeType: mime.lookup(defaultFilename),
          buffer: msg.payload
        };
      } else if (_.isObject(msg.payload) && msg.payload.file instanceof Buffer) {
        if (_.isEmpty(defaultFilename) || _.isEmpty(Path.extname(defaultFilename))) {
          node.error('Unknown filetype, use the "name" parameter to specify the file name and extension as default');
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
      if (!_(validExtensions).contains(file.extension)) {
        transform = BufferTransformers.zip
      }
      // zip the file if needed or leave it as is
      transform(file)
        .then(function(newFile) {
          //console.log('++++', newFile);
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
