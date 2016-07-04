var _ = require('underscore');
var ChatContext = require('./lib/chat-context.js');
var moment = require('moment');

module.exports = function(RED) {

  function ChatBotMessage(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.message = config.message;
    this.answer = config.answer;
    this.track = config.track;

    // extract subtokens from a object value
    var extractObjectKeys = function(value, subtokens) {

      var result = value;
      var currentValue = value;

      if (_.isArray(subtokens) && !_.isEmpty(subtokens)) {
        _(subtokens).each(function(subtoken) {
          if (_.isObject(currentValue) && currentValue[subtoken] != null) {
            currentValue = currentValue[subtoken];
          }
        });
        result = currentValue;
      }

      return result;
    };

    var getTokenValue = function(token, msg) {
      var value = null;
      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var subtokens = token.split('.');
      var variable = subtokens[0];
      var chatContext = context.flow.get('chat:' + chatId) || ChatContext(chatId);

      if (!_.isEmpty(chatContext.get(variable))) {
        value = chatContext.get(variable);
      } else if (!_.isEmpty(context.get(variable))) {
        value = context.get(variable);
      } else if (!_.isEmpty(context.flow.get(variable))) {
        value = context.flow.get(variable);
      } else if (!_.isEmpty(context.global.get(variable))) {
        value = context.global.get(variable);
      } else if (!_.isEmpty(msg[variable])) {
        value = msg[variable];
      }

      // access sub tokens
      if (subtokens.length > 0) {
        value = extractObjectKeys(value, subtokens.slice(1));
      }

      return value;
    };

    var replaceTokens = function(message, tokens, msg) {

      if (tokens != null && tokens.length !== 0) {
        // replace all tokens
        _(tokens).each(function(token) {
          var value = getTokenValue(token, msg);
          // todo make regexp
          message = message.replace('{{' + token + '}}', value);
        });

      }

      return message;
    };


    // relay message
    var handler = function(msg) {
      node.send([null, msg]);
    };
    RED.events.on('node:' + config.id, handler);


    this.on('input', function(msg) {
      var message = node.message;
      var track = node.track;
      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var chatContext = context.flow.get('chat:' + chatId) || ChatContext(chatId);

      var answer = node.answer;

      if (!_.isEmpty(node.message)) {
        message = node.message;
      } else if (_.isString(msg.payload) && !_.isEmpty(msg.payload)) {
        message = msg.payload;
      } else {
        node.error('Empty message');
      }

      var tokens = message.match(/\{\{([A-Za-z0-9\-\.]*?)\}\}/g);
      if (tokens != null && tokens.length != 0) {
        tokens = _(tokens).map(function (token) {
          return token.replace('{{', '').replace('}}', '');
        });
      }

      message = replaceTokens(message, tokens, msg);

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (!_.isEmpty(node.wires[1])) {
        chatContext.set('currentConversationNode', node.id);
        chatContext.set('currentConversationNode_at', moment());
      }
      // send out the message
      msg.payload = {
        type: 'message',
        content: message,
        chatId: chatId,
        messageId: messageId,
        inbound: false
      };
      // reply flag
      if (answer) {
        msg.payload.options = {
          reply_to_message_id: messageId
        };
      }

      node.send(track ? [msg, null] : msg);
    });

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });
  }

  RED.nodes.registerType('chatbot-message', ChatBotMessage);
};
