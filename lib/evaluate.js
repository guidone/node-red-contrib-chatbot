const _ = require('underscore');

/**
 * Template
 * Return a simple function to evaluate handlebars like strings using the content of the message
 * i.e. "my {{payload.chatbotId}}", simple, without chat context, simplified version of template-async
 * when the chat context is not available
*/
module.exports = function(msg, node = null) {
  // extract subtokens from a object value
  const extractObjectKeys = function(value, subtokens) {
    let result = value;
    let currentValue = value;

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

  const getTokenValue = function(token, msg) {
    let subtokens = token.split('.');
    // get the object to evaluate from, if context then expand all keys
    let obj = msg;
    if (node != null) {
      if (subtokens[0] === 'flow') {
        obj = node.context().flow.keys().reduce(
          (acc, key) => ({ ...acc, [key]: node.context().flow.get(key)}),
          {}
        );
        subtokens = subtokens.slice(1);
      } else if (subtokens[0] === 'global') {
        obj = node.context().global.keys().reduce(
          (acc, key) => ({ ...acc, [key]: node.context().global.get(key)}),
          {}
        );
        subtokens = subtokens.slice(1);
      }
    }

    const value = extractObjectKeys(obj, subtokens);
    return value != null ? value : '';
  };

  const replaceTokens = function(message, tokens, msg) {
    if (tokens != null && tokens.length !== 0) {
      // replace all tokens
      _(tokens).each(token => {
        let value = getTokenValue(token, msg);
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
    let tokens = message.match(/\{\{([A-Za-z0-9\-\.]*?)\}\}/g);
    if (tokens != null && tokens.length != 0) {
      tokens = _(tokens).map(token => token.replace('{{', '').replace('}}', ''));
    }
    // replace them
    return replaceTokens(message, tokens, msg);
  };
};
