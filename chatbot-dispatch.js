var _ = require('underscore');

// [ ] include a way for startover
// [ ] docs

module.exports = function(RED) {

  function ChatBotDispatch(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.parseType = config.parseType;
    this.parseVariable = config.parseVariable;

    this.on('input', function(msg) {

      var context = node.context();
      var currentConversationNode = context.flow.get('currentConversationNode');
      if (currentConversationNode != null) {
        // void the current conversation
        context.flow.set('currentConversationNode', null);
        // emit message
        RED.events.emit('node:' + currentConversationNode, msg);
      } else {
        node.send(msg);
      }

    });
  }
  RED.nodes.registerType('chatbot-dispatch', ChatBotDispatch);

};
