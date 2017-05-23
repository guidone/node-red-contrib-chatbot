var qr = require('qr-image');
var MessageTemplate = require('./lib/message-template.js');

module.exports = function(RED) {

  function ChatBotQRCode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;

    this.on('input', function(msg) {
      var message = node.message;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var template = MessageTemplate(msg, node);

      var buffer = qr.imageSync(template(message));

      // send out the picture with the qr
      msg.payload = {
        type: 'photo',
        content: buffer,
        //filename: '',
        chatId: chatId,
        messageId: messageId,
        inbound: false
      };

      node.send(msg);
    });
  }
  RED.nodes.registerType('chatbot-qrcode', ChatBotQRCode);

};
