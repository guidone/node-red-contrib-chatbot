var _ = require('underscore');
var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotTopic(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.rules = config.rules;

    this.on('input', function(msg) {

      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var chatContext = context.global.get('chat:' + chatId);

      var rules = node.rules;
      // do nothing
      if (originalMessage == null || rules.length == 0) {
        return;
      }
      var output = [];
      var currentTopic = chatContext.get('topic');

      rules.forEach(function(rule) {
        output.push(utils.matchContext(currentTopic, rule.topic) ? msg : null);
      });
      node.send(output);
    });
  }

  RED.nodes.registerType('chatbot-topic', ChatBotTopic);
};
