var _ = require('underscore');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotLocation(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.latitude = config.latitude;
    this.longitude = config.longitude;
    this.place = config.place;
    this.transports = ['telegram', 'slack', 'facebook', 'viber'];

    this.on('input', function(msg) {

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var latitude = utils.extractValue('float', 'latitude', node, msg, false);
      var longitude = utils.extractValue('float', 'longitude', node, msg, false);
      var place = utils.extractValue('string', 'place', node, msg, false);

      latitude = _.isNumber(latitude) ? latitude : parseFloat(latitude);
      longitude = _.isNumber(longitude) ? longitude : parseFloat(longitude);

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
