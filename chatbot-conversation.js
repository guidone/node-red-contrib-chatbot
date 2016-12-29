var _ = require('underscore');
var ChatContextStore = require('./lib/chat-context-store');

module.exports = function(RED) {

  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.chatId = config.chatId;
    this.transport = config.transport;

    this.on('input', function(msg) {

      var chatId = null;
      if (!_.isEmpty(node.chatId)) {
        chatId = node.chatId;
      } else if (msg.payload != null && msg.payload.chatId != null) {
        chatId = msg.payload.chatId;
      }

      var transport = null;
      if (!_.isEmpty(node.transport)) {
        transport = node.transport;
      } else if (msg.payload != null && msg.payload.transport != null) {
        transport = msg.payload.transport;
      }

      // ensure the original message is injected
      msg.originalMessage = {
        chat: {
          id: chatId
        },
        message_id: null,
        transport: transport
      };
      msg.chat = function() {
        return ChatContextStore.getOrCreateChatContext(node, chatId, {
          chatId: chatId,
          transport: transport,
          authorized: true
        });
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
