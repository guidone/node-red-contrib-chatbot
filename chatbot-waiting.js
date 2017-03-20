var _ = require('underscore');
var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotWaiting(config) {
    RED.nodes.createNode(this, config);

    this.waitingType = config.waitingType;
    this.transports = ['telegram', 'slack', 'facebook'];

    this.on('input', function(msg) {

      var node = this;
      var waitingType = this.waitingType;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }
      if (utils.getTransport(msg) === 'slack' && waitingType !== 'typing') {
        node.error('Only \'typing\' is supported for slack transport');
        return;
      }

      msg.payload = {
        type: 'action',
        waitingType: !_.isEmpty(waitingType) ? waitingType : 'typing',
        chatId: chatId,
        inbound: false
      };

      node.send(msg);
    });
  }
  RED.nodes.registerType('chatbot-waiting', ChatBotWaiting);

};
