var _ = require('underscore');

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

  function when(param) {
    if (param != null && _.isFunction(param.then)) {
      return param;
    } else if (param != null) {
      return new Promise(function(resolve) {
        resolve(param);
      })
    } else {
      return new Promise(function(resolve, reject) {
        reject();
      });
    }
  }

  var getTokenValue = function(token) {

    console.log('///getTokenValue', token);

    var value = null;
    var context = node.context();
    var subtokens = token.split('.');
    var variable = subtokens[0];
    var chatContext = msg.chat();

    if (token === 'payload') {
      value = String(msg.payload);
    } else if (chatContext != null && chatContext.get(variable) != null) {
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

    return when(value)
      .then(function(value) {
        // if nothing found, return empty space
        return value != null ? value : when('');
      });
// todo re-enable subtokens
    // access sub tokens
    //if (subtokens.length > 0) {
    //  value = extractObjectKeys(value, subtokens.slice(1));
    //}

    //return value != null ? value : '';
    //return value;
  };

  var replaceTokens = function(message, tokens, msg) {

    var stack = new Promise(function(resolve, reject) {
      resolve(message);
    });


    if (tokens != null && tokens.length !== 0) {
      // replace all tokens
      _(tokens).each(function(token) {
        stack = stack.then(function(message) {
          return new Promise(function(resolve) {
            getTokenValue(token)
              .then(function(value) {
                resolve(message.replace(new RegExp('{{' + token + '}}','g'), value));
              });
          });
        });

        //var value = getTokenValue(token, msg);
        //message = message.replace(new RegExp('{{' + token + '}}','g'), value);
      });

    }

    return stack;
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
