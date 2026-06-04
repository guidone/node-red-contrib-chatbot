const { ChatExpress } = require('chat-platform');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotSupportTable(config) {
    RED.nodes.createNode(this, config);
    globalContextHelper.init(this.context().global);
    this.on('input', function() {
      ChatExpress.showCompatibilityChart();
    });
  }

  RED.nodes.registerType('chatbot-support-table', ChatBotSupportTable);
};
