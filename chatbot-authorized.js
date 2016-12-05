module.exports = function(RED) {

  function ChatBotAuthorized(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {

      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
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
