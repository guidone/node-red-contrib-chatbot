module.exports = function(RED) {

  function ChatBotAuthorized(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {

      var context = node.context(); context.global = context.global || context;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var chatContext = context.global.get('chat:' + chatId);

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
