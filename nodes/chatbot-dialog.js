var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotDialog(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.name = config.name;
    this.elements = config.elements;
    this.title = config.title;
    this.submitLabel = config.submitLabel;
    this.transports = ['slack'];

    this.on('input', function(msg) {

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var title = utils.extractValue('string', 'title', node, msg, false);
      var submitLabel = utils.extractValue('string', 'submitLabel', node, msg, false);
      var elements = utils.extractValue('arrayOfObject', 'elements', node, msg, true);

      // payload
      msg.payload = {
        type: 'dialog',
        title: title,
        submitLabel: submitLabel,
        elements: elements,
        chatId: chatId,
        messageId: messageId
      };
      node.send(msg);
    });
  }

  RED.nodes.registerType('chatbot-dialog', ChatBotDialog);
};
