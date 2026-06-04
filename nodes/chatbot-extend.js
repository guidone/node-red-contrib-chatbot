const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotExtend(config) {
    RED.nodes.createNode(this, config);
    globalContextHelper.init(this.context().global);
    this.codeJs = config.codeJs;
  }
  RED.nodes.registerType('chatbot-extend', ChatBotExtend);
};
