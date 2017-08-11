var _ = require('underscore');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotLocation(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.latitude = config.latitude;
    this.longitude = config.longitude;
    this.place = config.place;
    this.transports = ['telegram', 'slack', 'facebook'];

    this.on('input', function(msg) {

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var latitude = node.latitude;
      var longitude = node.longitude;
      var place = node.place;

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      if (_.isObject(msg.payload) && _.isNumber(msg.payload.latitude) && _.isNumber(msg.payload.longitude)) {
        latitude = msg.payload.latitude;
        longitude = msg.payload.longitude;
      }

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
