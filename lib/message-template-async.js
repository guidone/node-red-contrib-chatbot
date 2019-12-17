const _ = require('underscore');
const utils = require('./helpers/utils');
const when = utils.when;
const moment = require('moment');

module.exports = (msg, node, opts) => {

  const options = Object.assign({ 
    preserveNumbers: false // do not translate numbers into string 
  }, opts)

  // extract subtokens from a object value
  const extractObjectKeys = (value, subtokens) => {
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

  const getTokenValue = token => {
console.log('cerco', token)
    let value = null;
    const context = node.context();
    const subtokens = token.split('.');
    const variable = subtokens[0];
    const chatContext = msg.chat();

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
    } else if (token.match(/^global\./)) {
      // avoid undefined
      value = context.global.get(subtokens[1]) != null ? context.global.get(subtokens[1]) : null
    }

    return when(value)
      .then(value => {
        // if nothing found, return empty space
        return value != null ? value : when(null);
      })
      .then(value => {
        if (subtokens.length > 0) {
          value = extractObjectKeys(value, subtokens.slice(1));
        }
        return value;
      });
  };

  const replaceTokens = (message, tokens) => {

    let stack = new Promise(resolve => resolve(message));

    if (tokens != null && tokens.length !== 0) {
      // replace all tokens
      _(tokens).each(token => {
        stack = stack.then(message => {
          return new Promise(resolve => {
            getTokenValue(token)
              .then(value => {
                // if value was not fount, leve the token in place
                if (value != null) {
                  // todo take the format date from config
                  const formattedValue = value instanceof moment ? value.format('DD MMMM,YYYY') : value;
                  resolve(message.replace(new RegExp(`{{${token}}}`, 'g'), formattedValue));
                } else {
                  resolve(message);
                }
              });
          });
        });
      });
    }

    return stack;
  };

  const renderString = message => {
    if (_.isEmpty(message)) {
      return message;
    }
    // extract tokens
    let tokens = message.match(/\{\{([A-Za-z0-9\-\._]*?)\}\}/g);
    if (tokens != null && tokens.length != 0) {
      tokens = tokens.map(token => token.replace('{{', '').replace('}}', ''));
    }
    // replace them
    return replaceTokens(message, tokens);
  }

  const renderObject = item => {
    let task = when(true);
    const result = {};
    return new Promise(resolve => {
      _(item).each((value, key) => {
        task = task
          .then(() => renderItem(value))
          .then(translated => result[key] = translated);
      });
      task.then(() => resolve(result));
    });
  };

  const renderArray = item => {
    let task = when(true);
    const result = [];
    return new Promise(resolve => {
      _(item).each(value => {
        task = task
          .then(() => renderItem(value))
          .then(translated => result.push(translated));
      });
      task.then(() => resolve(result));
    });
  }

  const renderItem = item => {
    if (_.isString(item)) {
      return renderString(item);
    } else if (!options.preserveNumbers && _.isNumber(item)) {
      return renderString(String(item));
    } else if (options.preserveNumbers && _.isNumber(item)) {
      return item;
    } else if (_.isArray(item)) {
      return renderArray(item);
    } else if (item instanceof Buffer) {
      return when(item); // leave buffers untouched
    } else if (_.isObject(item)) {
      return renderObject(item);
    }
    return when(item);
  }

  return function() {
    const toTranslate = Array.prototype.slice.call(arguments, 0);
    return new Promise(resolve => {
      const translated = [];
      let task = when(true);
      // translate each element of the array
      _(toTranslate).each(sentence => {
        task = task
          .then(() => renderItem(sentence))
          .then(message => translated.push(message));
      });
      // finally
      task.then(() => {
        if (translated.length === 1) {
          resolve(translated[0]);
        } else {
          resolve(translated);
        }
      });
    });
  }
};
