var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotWaiting(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.waitingType = config.waitingType;
    this.transports = ['telegram', 'slack'];

    this.on('input', function(msg) {

      var node = this;
      var waitingType = this.waitingType;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);

      // check transport compatibility
      if (!_.contains(node.transports, msg.originalMessage.transport)) {
        node.error('This node is not available for transport: ' + msg.originalMessage.transport);
        return;
      }
      if (msg.originalMessage.transport === 'slack' && waitingType !== 'typing') {
        node.error('Only \'typing\' is supported for slack transport');
        return;
      }

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
