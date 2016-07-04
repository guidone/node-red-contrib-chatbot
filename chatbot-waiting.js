var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotWaiting(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.waitingType = config.waitingType;

    this.on('input', function(msg) {

      var waitingType = this.waitingType;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);

      var typing = {
        payload: {
          type: 'action',
          waitingType: !_.isEmpty(waitingType) ? waitingType : 'typing',
          chatId: chatId,
          inbound: false
        }
      };

      node.send(typing);
    });
  }
  RED.nodes.registerType('chatbot-waiting', ChatBotWaiting);

};
