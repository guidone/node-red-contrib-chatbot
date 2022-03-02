const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotCommand(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);

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

  registerType('chatbot-transport', ChatBotCommand);
};
