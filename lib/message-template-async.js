var _ = require('underscore');
var utils = require('./helpers/utils');
var when = utils.when;
var moment = require('moment');

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

  var getTokenValue = function(token) {

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
      })
      .then(function(value) {
        if (subtokens.length > 0) {
          value = extractObjectKeys(value, subtokens.slice(1));
        }
        return value;
      });
  };

  var replaceTokens = function(message, tokens) {

    var stack = new Promise(function(resolve) {
      resolve(message);
    });

    if (tokens != null && tokens.length !== 0) {
      // replace all tokens
      _(tokens).each(function(token) {
        stack = stack.then(function(message) {
          return new Promise(function(resolve) {
            getTokenValue(token)
              .then(function(value) {
                // todo take the format date from config
                var formattedValue = value instanceof moment ? value.format('DD MMMM,YYYY') : value;
                resolve(message.replace(new RegExp('{{' + token + '}}','g'), formattedValue));
              });
          });
        });
      });
    }

    return stack;
  };

  function renderString(message) {
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
    return replaceTokens(message, tokens);
  }

  function renderObject(item) {
    var task = when(true);
    var result = {};
    return new Promise(function(resolve) {
      _(item).each(function (value, key) {
        task = task.then(function() {
          return renderItem(value);
        }).then(function(translated) {
          result[key] = translated;
        });
      });
      task.then(function() {
        resolve(result);
      });
    });
  }

  function renderArray(item) {
    var task = when(true);
    var result = [];
    return new Promise(function(resolve) {
      _(item).each(function (value) {
        task = task.then(function() {
          return renderItem(value);
        }).then(function(translated) {
          result.push(translated);
        });
      });
      task.then(function() {
        resolve(result);
      });
    });
  }

  function renderItem(item) {
    if (_.isString(item)) {
      return renderString(item);
    } else if (_.isArray(item)) {
      return renderArray(item);
    } else if (_.isObject(item)) {
      return renderObject(item);
    }
    return when(item);
  }

  return function() {
    var toTranslate = Array.prototype.slice.call(arguments, 0);
    return new Promise(function(resolve) {
      var translated = [];
      var task = when(true);
      // translate each element of the array
      _(toTranslate).each(function(sentence) {
        task = task
          .then(function() {
            return renderItem(sentence);
          })
          .then(function(message) {
            translated.push(message);
          });
      });
      // finally
      task.then(function() {
        if (translated.length === 1) {
          resolve(translated[0]);
        } else {
          resolve(translated);
        }
      });
    });
  }
};
