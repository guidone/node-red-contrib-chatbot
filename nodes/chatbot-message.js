var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var MessageTemplate = require('../lib/message-template-async');
var emoji = require('node-emoji');
var ChatExpress = require('../lib/chat-platform/chat-platform');

module.exports = function(RED) {

  function ChatBotMessage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.answer = config.answer;
    this.parse_mode = config.parse_mode;
    this.transports = ['telegram', 'slack', 'facebook', 'smooch', 'viber', 'twilio'];

    this.pickOne = function(messages) {
      var luck = Math.floor(Math.random() * messages.length);
      return _.isString(messages[luck]) ? messages[luck] : messages[luck].message;
    };

    this.on('input', function(msg) {

      //var message = node.message;
      var answer = node.answer;
      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);
      var transport = utils.getTransport(msg);

      // check if valid message
      if (!utils.isValidMessage(msg, node)) {
        return;
      }
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'message') && !utils.matchTransport(node, msg)) {
        return;
      }

      // try to get a plain string or number from config or payload or "message" variable
      // also try to get message from the "answer" key in payload, that to try to get the answer directly from nodes
      // like dialogflow/recast
      // also try to get an array of messages from config and pick one randomly
      var messages = utils.extractValue(['string','messages', 'number'], 'message', node, msg)
        || utils.extractValue('string', 'answer', node, msg, false);

      var message = _.isArray(messages) ? node.pickOne(messages) : messages;

      template(message)
        .then(function(message) {
          // payload
          msg.payload = {
            type: 'message',
            content: emoji.emojify(message),
            chatId: chatId,
            messageId: messageId,
            inbound: false
          };
          // reply flag
          msg.payload.options = {};
          if (answer) {
            msg.payload.options.reply_to_message_id = messageId;
          }
          // send out reply
          node.send(msg);
        });
    });
  }

  RED.nodes.registerType('chatbot-message', ChatBotMessage);
};
