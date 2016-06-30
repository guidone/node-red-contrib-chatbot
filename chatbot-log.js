var _ = require('underscore');
var moment = require('moment');
var ChatContext = require('./lib/chat-context.js');

module.exports = function(RED) {

  function ChatBotLog(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {

      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var inbound = msg.payload != null && msg.payload.inbound === true;
      var chatContext = context.flow.get('chat:' + chatId) || ChatContext(chatId);
      var firstName = chatContext.get('firstName');
      var lastName = chatContext.get('lastName');

      var name = [];
      if (firstName != null ) {
        name.push(firstName);
      }
      if (lastName != null ) {
        name.push(lastName);
      }

      if (msg.payload != null && typeof msg.payload == 'object') {
        var logString = null;
        switch(msg.payload.type) {
          case 'message':
            logString = msg.payload.content.replace(/\n/g, '');
            break;
          case 'location':
            logString = 'latitude: ' + msg.payload.content.latitude + ' longitude: ' + msg.payload.content.latitude;
            break;
        }
        // sends out
        if (logString != null) {
          node.send({
            payload: chatId + ' '
            + (!_.isEmpty(name) ? '[' + name.join(' ') + '] ' : '')
            + (inbound ? '> ' : '< ')
            + moment().toString() + ' - ' + logString
          });
        }
      }

    });
  }
  RED.nodes.registerType('chatbot-log', ChatBotLog);

};
