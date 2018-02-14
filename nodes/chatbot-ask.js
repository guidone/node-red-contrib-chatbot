var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var MessageTemplate = require('../lib/message-template-async');
var emoji = require('node-emoji');

module.exports = function(RED) {

  function ChatBotAsk(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.answers = config.answers;
    this.message = config.message;
    this.inline = config.inline;
    this.transports = ['telegram'];

    this.on('input', function(msg) {

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);
      //var answers = null;
      //var message = null;

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var answers = utils.extractValue('arrayOfString', 'buttons', node, msg, true);
      var message = utils.extractValue('string', 'message', node, msg, false);

      // get from config or payload
      /*if (_.isArray(node.answers) && !_.isEmpty(node.answers)) {
        answers = node.answers;
      } else if (_.isObject(msg.payload) && _.isArray(msg.payload.buttons) && !_.isEmpty(msg.payload.buttons)) {
        answers = msg.payload.buttons;
      }
      // get from config or payload
      if (_.isString(node.message) && !_.isEmpty(node.message)) {
        message = node.message;
      } else if (_.isObject(msg.payload) && _.isString(msg.payload.message) && !_.isEmpty(msg.payload.message)) {
        message = msg.payload.message;
      }*/

      template(message)
        .then(function(translated) {
          msg.payload = {
            type: 'buttons',
            content: message != null ? emoji.emojify(translated) : null,
            chatId: chatId,
            messageId: messageId,
            buttons: answers
          };
          node.send(msg);
        });
    });
  }

  RED.nodes.registerType('chatbot-ask', ChatBotAsk);
};
