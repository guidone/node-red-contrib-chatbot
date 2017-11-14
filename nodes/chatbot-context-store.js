var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotContextStore(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    // just store the information
    node.contextStorage = config.contextStorage;
    try {
      node.contextParams = JSON.parse(config.contextParams);
    } catch (e) {
      console.log('Invalid JSON in context storage params (' + this.name + ')');
    }
  }

  RED.nodes.registerType('chatbot-context-store', ChatBotContextStore);
};
