const { ChatExpress } = require('chat-platform');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotSupportTable(config) {
    RED.nodes.createNode(this, config);
    globalContextHelper.init(this.context().global);
    this.on('input', function() {
      ChatExpress.showCompatibilityChart();
    });
  }

  registerType('chatbot-support-table', ChatBotSupportTable);
};
