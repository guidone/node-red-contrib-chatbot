var ChatLog = require('../lib/chat-log.js');
var utils = require('../lib/helpers/utils');
var when = utils.when;

module.exports = function(RED) {

  function ChatBotLog(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {

      var task = new Promise(function(resolve) {
        resolve();
      });
      var chatContext = msg.chat();

      if (chatContext != null) {
        task = task.then(function() {
          return chatContext.get('firstName', 'lastName', 'chatId');
        });
      }

      when(task)
        .then(function(jsonContext) {
          var chatLog = new ChatLog(jsonContext);
          msg.payload = chatLog.message(msg);
          node.send(msg);
        });
    });
  }
  RED.nodes.registerType('chatbot-log', ChatBotLog);

};
