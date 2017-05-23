module.exports = function(RED) {

  function ChatBotAuthorized(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {
      var chatContext = msg.chat();
      // check
      if (chatContext != null && chatContext.get('authorized')) {
        node.send([msg, null]);
      } else {
        node.send([null, msg]);
      }
    });
  }

  RED.nodes.registerType('chatbot-authorized', ChatBotAuthorized);
};
