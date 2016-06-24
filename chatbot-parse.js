var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotParse(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.parseType = config.parseType;
    this.parseVariable = config.parseVariable;

    this.on('input', function(msg) {

      node.send(msg);

    });
  }
  RED.nodes.registerType('chatbot-parse', ChatBotParse);

};
