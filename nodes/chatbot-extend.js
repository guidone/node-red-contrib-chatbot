const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotExtend(config) {
    RED.nodes.createNode(this, config);
    this.codeJs = config.codeJs;
  }
  registerType('chatbot-extend', ChatBotExtend);
};
