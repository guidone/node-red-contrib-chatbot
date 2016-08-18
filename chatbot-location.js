var _ = require('underscore');
var moment = require('moment');

module.exports = function(RED) {

  function ChatBotLocation(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.latitude = config.latitude;
    this.longitude = config.longitude;
    this.place = config.place;
    this.transports = ['telegram', 'slack', 'facebook'];

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);

      var latitude = node.latitude;
      var longitude = node.longitude;
      var place = node.place;

      // send out the message
      msg.payload = {
        type: 'location',
        content: {
          latitude: latitude,
          longitude: longitude
        },
        place: place,
        chatId: chatId,
        messageId: messageId,
        inbound: false
      };

      node.send([msg, null]);
    });

  }

  RED.nodes.registerType('chatbot-location', ChatBotLocation);
};
