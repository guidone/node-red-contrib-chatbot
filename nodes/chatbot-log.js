const ChatLog = require('../lib/chat-log.js');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

const when = utils.when;

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotLog(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);

    this.on('input', function(msg) {

      var task = when(true);
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
  registerType('chatbot-log', ChatBotLog);

};
