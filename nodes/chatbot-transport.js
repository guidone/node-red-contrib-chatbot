module.exports = function(RED) {

  function ChatBotCommand(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.rules = config.rules;

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var rules = node.rules;
      // do nothing
      if (originalMessage == null || rules.length == 0) {
        return;
      }

      var output = [];
      rules.forEach(function(rule) {
        output.push(originalMessage.transport == rule.transport ? msg : null);
      });
      node.send(output);
    });
  }

  RED.nodes.registerType('chatbot-transport', ChatBotCommand);
};
