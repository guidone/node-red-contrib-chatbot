var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotSwitch(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.rules = config.rules;

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var currentType = utils.getType(msg);
      var rules = node.rules;

      // do nothing
      if (originalMessage == null || rules.length === 0 || currentType == null) {
        return;
      }
      var output = [];
      var matched = false;

      rules.forEach(function(rule) {
        if (!matched && (rule.type === currentType || rule.type === '*')) {
          matched = true;
          output.push(msg);
        } else {
          output.push(null);
        }
      });
      node.send(output);
    });
  }

  RED.nodes.registerType('chatbot-switch', ChatBotSwitch);
};
