var _ = require('underscore');
var moment = require('moment');
var ChatLog = require('./lib/chat-log.js');

module.exports = function(RED) {

  function ChatBotLog(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {

      var chatContext = msg.chat();

      if (chatContext != null) {
        var chatLog = new ChatLog(chatContext);
        node.send(chatLog.message(msg));
      }

    });
  }
  RED.nodes.registerType('chatbot-log', ChatBotLog);

};
