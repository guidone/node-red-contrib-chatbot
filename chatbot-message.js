var _ = require('underscore');
var utils = require('./lib/helpers/utils');
var MessageTemplate = require('./lib/message-template');
var emoji = require('node-emoji');

module.exports = function(RED) {

  function ChatBotMessage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.answer = config.answer;
    this.parse_mode = config.parse_mode;
    this.transports = ['telegram', 'slack', 'facebook', 'smooch'];

    this.pickOne = function(messages) {
      var luck = Math.floor(Math.random() * messages.length);
      return _.isString(messages[luck]) ? messages[luck] : messages[luck].message;
    };

    this.emptyMessages = function(messages) {
      return _.isEmpty(messages) || _(messages).all(function(message) {
        return _.isEmpty(message);
      });
    };

    this.on('input', function(msg) {
      var message = node.message;
      var answer = node.answer;
      var parse_mode = node.parse_mode;
      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      if (_.isString(node.message) && !_.isEmpty(node.message)) {
        message = node.message;
      } else if (_.isArray(node.message) && !this.emptyMessages(node.message)) {
        message = node.pickOne(node.message);
      } else if (_.isString(msg.payload) && !_.isEmpty(msg.payload)) {
        message = msg.payload;
      } else if (_.isArray(msg.payload) && !this.emptyMessages(msg.payload)) {
        message = node.pickOne(msg.payload);
      } else if (_.isNumber(msg.payload)) {
        message = String(msg.payload);
      } else {
        node.error('Empty message');
      }

      // payload
      msg.payload = {
        type: 'message',
        content: emoji.emojify(template(message)),
        chatId: chatId,
        messageId: messageId,
        inbound: false
      };

      msg.payload.options = {};
      // parse mode
      if (!_.isEmpty(parse_mode)) {
        msg.payload.options.parse_mode = parse_mode;
      }
      // reply flag
      if (answer) {
        msg.payload.options.reply_to_message_id = messageId;
      }
      // send out reply
      node.send(msg);
    });
  }

  RED.nodes.registerType('chatbot-message', ChatBotMessage);
};
