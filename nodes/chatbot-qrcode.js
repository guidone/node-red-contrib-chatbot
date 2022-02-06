const qr = require('qr-image');
const MessageTemplate = require('../lib/message-template-async');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotQRCode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.message = config.message;

    this.on('input', function(msg) {

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);
      var message = utils.extractValue('string', 'message', node, msg);

      template(message)
        .then(function(translated) {
          var buffer = qr.imageSync(translated);
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
    });
  }
  registerType('chatbot-qrcode', ChatBotQRCode);

};
