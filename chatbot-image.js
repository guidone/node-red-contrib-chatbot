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
    this.transports = ['telegram', 'slack', 'facebook'];

    this.on('input', function(msg) {

      var path = node.filename;
      var name = node.name;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);

      // check transport compatibility
      if (!_.contains(node.transports, msg.originalMessage.transport)) {
        node.error('This node is not available for transport: ' + msg.originalMessage.transport);
        return;
      }

      // todo make asynch here
      var content = msg.payload;
      if (!_.isEmpty(path)) {
        content = fs.readFileSync(path);
      }

      // get filename
      var filename = 'image';
      if (!_.isEmpty(path)) {
        filename = Path.basename(path);
      } else if (!_.isEmpty(name)) {
        filename = sanitize(name);
      }

      // send out the message
      msg.payload = {
        type: 'photo',
        content: content,
        filename: filename,
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
