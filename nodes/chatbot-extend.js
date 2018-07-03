module.exports = function(RED) {
  function ChatBotExtend(config) {
    RED.nodes.createNode(this, config);
    this.codeJs = config.codeJs;
  }
  RED.nodes.registerType('chatbot-extend', ChatBotExtend);
};
