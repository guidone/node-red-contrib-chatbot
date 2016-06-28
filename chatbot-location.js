var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotLocation(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.latitude = config.latitude;
    this.longitude = config.longitude;

    // relay message
    var handler = function(msg) {
      node.send([null, msg]);
    };
    RED.events.on('node:' + config.id, handler);

    this.on('input', function(msg) {

      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var latitude = node.latitude;
      var longitude = node.longitude;

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (!_.isEmpty(node.wires[1])) {
        context.flow.set('currentConversationNode', node.id);
      }
      // send out the message
      msg.payload = {
        type: 'location',
        content: {
          latitude: latitude,
          longitude: longitude
        },
        chatId: chatId,
        messageId: messageId,
        inbound: false
      };

      node.send([msg, null]);
    });

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });
  }

  RED.nodes.registerType('chatbot-location', ChatBotLocation);

};
