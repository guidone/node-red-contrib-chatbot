const { ChatExpress } = require('chat-platform');
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotSupportTable(config) {
    RED.nodes.createNode(this, config);
    this.on('input', function() {
      ChatExpress.showCompatibilityChart();
    });
  }

  registerType('chatbot-support-table', ChatBotSupportTable);
};
