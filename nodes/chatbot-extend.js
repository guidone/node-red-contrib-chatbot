const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotExtend(config) {
    RED.nodes.createNode(this, config);
    globalContextHelper.init(this.context().global);
    this.codeJs = config.codeJs;
  }
  registerType('chatbot-extend', ChatBotExtend);
};
