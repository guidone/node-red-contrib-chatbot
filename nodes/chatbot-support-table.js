var ChatExpress = require('../lib/chat-platform/chat-platform');

module.exports = function(RED) {
  function ChatBotSupportTable(config) {
    RED.nodes.createNode(this, config);
    this.on('input', function() {
      ChatExpress.showCompatibilityChart();
    });
  }
  RED.nodes.registerType('chatbot-support-table', ChatBotSupportTable);
};
