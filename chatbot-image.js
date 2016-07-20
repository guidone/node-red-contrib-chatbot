var _ = require('underscore');
var moment = require('moment');
var ChatContext = require('./lib/chat-context.js');
var fs = require('fs');
var Path = require('path');
var sanitize = require("sanitize-filename");

module.exports = function(RED) {

  function ChatBotImage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.filename = config.filename;
    this.name = config.name;
    this.track = config.track;
    this.transports = ['telegram', 'slack', 'facebook'];

    // relay message
    var handler = function(msg) {
      node.send([null, msg]);
    };
    RED.events.on('node:' + config.id, handler);

    this.on('input', function(msg) {

      var context = node.context();
      var track = node.track;
      var path = node.filename;
      var name = node.name;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var chatContext = context.flow.get('chat:' + chatId) || ChatContext(chatId);

      // check transport compatibility
      if (!_.contains(node.transports, msg.originalMessage.transport)) {
        node.error('This node is not available for transport: ' + msg.originalMessage.transport);
        return;
      }

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (!_.isEmpty(node.wires[1])) {
        chatContext.set('currentConversationNode', node.id);
        chatContext.set('currentConversationNode_at', moment());
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
      node.send(track ? [msg, null] : msg);
    });

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });
  }

  RED.nodes.registerType('chatbot-image', ChatBotImage);
};
