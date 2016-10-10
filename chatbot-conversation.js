var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.chatId = config.chatId;
    this.transport = config.transport;

    this.on('input', function(msg) {

      var chatId = node.chatId;
      var transport = node.transport;

      // ensure the original message is injected
      msg.originalMessage = {
        chat: {
          id: chatId
        },
        message_id: null,
        transport: transport
      };

      // fix chat id in payload if any
      if (_.isObject(msg.payload) && msg.payload.chatId != null) {
        msg.payload.chatId = chatId;
      }

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-conversation', ChatBotConversation);
};
