var _ = require('underscore');
var moment = require('moment');
var MessageTemplate = require('./lib/message-template.js');
var emoji = require('node-emoji');

module.exports = function(RED) {

  function ChatBotRequest(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.buttonLabel = config.buttonLabel;
    this.requestType = config.requestType;

    // relay message
    var handler = function(msg) {
      node.send([null, msg]);
    };
    RED.events.on('node:' + config.id, handler);

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var message = node.message;
      var requestType = node.requestType;
      var buttonLabel = node.buttonLabel;
      var template = MessageTemplate(msg, node);

      var keyboard = null;
      if (requestType === 'location') {
        keyboard = [
          [{
            text: !_.isEmpty(buttonLabel) ? buttonLabel : 'Send your position',
            request_location: true
          }]
        ];
      } else if (requestType === 'phone-number') {
        keyboard = [
          [{
            text: !_.isEmpty(buttonLabel) ? buttonLabel : 'Send your phone number',
            request_contact: true
          }]
        ];
      }

      // send out the message
      // todo move this format to telegram sender
      // todo restrict this node to telegram
      msg.payload = {
        type: 'message',
        content: emoji.emojify(template(message)),
        chatId: chatId,
        messageId: messageId,
        options: {
          reply_markup: JSON.stringify({
            keyboard: keyboard,
            'resize_keyboard': true,
            'one_time_keyboard': true
          })
        }
      };

      node.send([msg, null]);
    });

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });
  }

  RED.nodes.registerType('chatbot-request', ChatBotRequest);
};
