var qr = require('qr-image');
var MessageTemplate = require('../lib/message-template.js');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotQRCode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;

    this.on('input', function(msg) {

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);
      var message = utils.extractValue('string', 'message', node, msg);

      var buffer = qr.imageSync(template(message));

      // send out the picture with the qr
      msg.payload = {
        type: 'photo',
        content: buffer,
        chatId: chatId,
        messageId: messageId,
        inbound: false
      };

      node.send(msg);
    });
  }
  RED.nodes.registerType('chatbot-qrcode', ChatBotQRCode);

};
