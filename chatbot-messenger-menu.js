var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotMessengerMenu(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.items = config.items;
    this.transports = ['facebook'];

    this.on('input', function(msg) {

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var items = utils.extractValue('buttons', 'items', node, msg);

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
