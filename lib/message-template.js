var _ = require('underscore');
var ChatContext = require('./chat-context.js');

module.exports = function(msg, node) {

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
    var context = node.context(); context.global = context.global || context;
    var originalMessage = msg.originalMessage;
    var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
    var subtokens = token.split('.');
    var variable = subtokens[0];
    var chatContext = context.global.get('chat:' + chatId);

    if (!_.isEmpty(chatContext != null && chatContext.get(variable))) {
      value = chatContext.get(variable);
    } else if (!_.isEmpty(context.flow.get(variable))) {
      value = context.flow.get(variable);
    } else if (!_.isEmpty(context.get(variable))) {
      value = context.get(variable);
    } else if (!_.isEmpty(context.global.get(variable))) {
      value = context.global.get(variable);
    } else if (!_.isEmpty(msg[variable])) {
      value = msg[variable];
    }

    // access sub tokens
    if (subtokens.length > 0) {
      value = extractObjectKeys(value, subtokens.slice(1));
    }

    return value != null ? value : '';
  };

  var replaceTokens = function(message, tokens, msg) {

    if (tokens != null && tokens.length !== 0) {
      // replace all tokens
      _(tokens).each(function(token) {
        var value = getTokenValue(token, msg);
        message = message.replace(new RegExp('{{' + token + '}}','g'), value);
      });

    }

    return message;
  };


  return function(message) {
    if (_.isEmpty(message)) {
      return message;
    }
    // extract tokens
    var tokens = message.match(/\{\{([A-Za-z0-9\-\.]*?)\}\}/g);
    if (tokens != null && tokens.length != 0) {
      tokens = _(tokens).map(function (token) {
        return token.replace('{{', '').replace('}}', '');
      });
    }
    // replace them
    return replaceTokens(message, tokens, msg);
  };
};
