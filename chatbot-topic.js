var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotTopic(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.rules = config.rules;

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var chatContext = msg.chat();

      var rules = node.rules;

      // do nothing
      if (originalMessage == null || rules.length == 0) {
        return;
      }
      var output = [];
      var currentTopic = chatContext.get('topic');

      var matched = false;

      rules.forEach(function(rule) {
        if (!matched && utils.matchContext(currentTopic, rule.topic)) {
          matched = true;
          output.push(msg);
        } else {
          output.push(null);
        }
      });
      node.send(output);
    });
  }

  RED.nodes.registerType('chatbot-topic', ChatBotTopic);
};
