var _ = require('underscore');
var moment = require('moment');
var ChatContext = require('./lib/chat-context.js');
var ChatLog = require('./lib/chat-log.js');

module.exports = function(RED) {

  function ChatBotLog(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {

      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var chatContext = context.flow.get('chat:' + chatId) || ChatContext(chatId);
      var chatLog = new ChatLog(chatContext);

      node.send(chatLog.message(msg));
    });
  }
  RED.nodes.registerType('chatbot-log', ChatBotLog);

};
