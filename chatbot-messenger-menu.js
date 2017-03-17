var _ = require('underscore');
var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotMessengerMenu(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.items = config.items;
    this.message = config.message;
    this.transports = ['facebook'];

    this.on('input', function(msg) {


      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);

      var items = node.items;
      if (_.isArray(msg.payload)) {
        items = msg.payload;
      }

      // payload
      msg.payload = {
        type: 'persistent-menu',
        chatId: chatId,
        messageId: messageId,
        items: items
      };

      node.send(msg);
    });

  }

  RED.nodes.registerType('chatbot-messenger-menu', ChatBotMessengerMenu);
};
