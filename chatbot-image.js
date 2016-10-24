var _ = require('underscore');
var fs = require('fs');
var Path = require('path');
var sanitize = require("sanitize-filename");

module.exports = function(RED) {

  function ChatBotImage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.filename = config.filename;
    this.name = config.name;
    this.caption = config.caption;
    this.transports = ['telegram', 'slack', 'facebook', 'smooch'];

    this.on('input', function(msg) {

      var path = node.filename;
      var name = node.name;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var content = null;

      // check transport compatibility
      if (!_.contains(node.transports, msg.originalMessage.transport)) {
        node.error('This node is not available for transport: ' + msg.originalMessage.transport);
        return;
      }

      if (!_.isEmpty(path)) {
        content = fs.readFileSync(path);
      } else if (msg.payload instanceof Buffer) {
        content = msg.payload;
      } else if (_.isObject(msg.payload) && msg.payload.image instanceof Buffer) {
        content = msg.payload.image;
      }

      // get filename
      var filename = 'image';
      if (!_.isEmpty(path)) {
        filename = Path.basename(path);
      } else if (!_.isEmpty(name)) {
        filename = sanitize(name);
      }

      var caption = null;
      if (!_.isEmpty(node.caption)) {
        caption = node.caption;
      } else if (_.isObject(msg.payload) && _.isString(msg.payload.caption) && !_.isEmpty(msg.payload.caption)) {
        caption = msg.payload.caption;
      }

      // send out the message
      msg.payload = {
        type: 'photo',
        content: content,
        filename: filename,
        caption: caption,
        chatId: chatId,
        messageId: messageId,
        inbound: false
      };

      // send out reply
      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-image', ChatBotImage);
};
