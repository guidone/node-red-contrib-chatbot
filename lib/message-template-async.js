const _ = require('underscore');
const utils = require('./helpers/utils');
const when = utils.when;
const moment = require('moment');

const isEmpty = value => _.isEmpty(value) && !_.isNumber(value);
const byString = function(o, s) {
  let str = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  str = str.replace(/^\./, '');           // strip a leading dot
  var a = str.split('.');
  for (var i = 0, n = a.length; i < n; ++i) {
      var k = a[i];
      if (k in o) {
          o = o[k];
      } else {
          return;
      }
  }
  return o;
}

module.exports = (msg, node, opts) => {
  // these values are not stored in chat context, a user accessing the chatbot with different
  // chatIds could have the same chat context, the single source of truth for these values is
  // the originalMessage
  const specials = {
    chatId: msg.originalMessage.chatId,
    userId: msg.originalMessage.userId,
    messageId: msg.originalMessage.messageId, // for retrocompatibility
    inboundMessageId: msg.originalMessage.messageId,
    transport: msg.originalMessage.transport
  };

  // set current message in specials
  if (msg.payload != null && _.isString(msg.payload.content)) {
    specials.message = msg.payload.content;
  } else if (msg.previous != null && _.isString(msg.previous.content)) {
    specials.message = msg.previous.content;
  }
  const payload = _.isObject(msg.payload) ? msg.payload : {};
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

  const getTokenValue = async (token, language)  => {

    let value = null;
    const context = node.context();
    const subtokens = token.split('.');
    const variable = subtokens[0];
    const chatContext = msg.chat();

    if (token === 'payload') {
      value = String(msg.payload);
    } else if (token.startsWith('payload.')) {
      const stringPath = token.replace('payload.', '');
      value = byString(payload, stringPath);
      value = value != null ? value : token;
    } else if (token.startsWith('global.')) {
      // avoid undefined
      value = context.global.get(subtokens[1]) != null ? context.global.get(subtokens[1]) : null
    } else if (token.startsWith('tx.')) {
      // use global translator
      const tx = context.global.get('tx');
      value = _.isFunction(tx) ? tx(token.replace('tx.', ''), language) : token;
    } else if (specials[token] != null) {
      value = specials[token];
    } else {
      // excluded global, payload, need to access to the context
      let fromContext = await when(chatContext.get(variable));
      if (fromContext != null) {
        value = fromContext;
        if (subtokens.length > 0) {
          value = extractObjectKeys(value, subtokens.slice(1));
        }
      } else if (!isEmpty(context.flow.get(variable))) {
        value = context.flow.get(variable);
      } else if (!isEmpty(context.get(variable))) {
        value = context.get(variable);
      } else if (!isEmpty(context.global.get(variable))) {
        value = context.global.get(variable);
      } else if (!isEmpty(msg[variable])) {
        value = msg[variable];
      }
    }

    return value;
  };

  const replaceTokens = (message, tokens, language) => {

    let stack = new Promise(resolve => resolve(message));

    if (tokens != null && tokens.length !== 0) {
      // replace all tokens
      _(tokens).each(token => {
        stack = stack.then(message => {
          return new Promise(resolve => {
            getTokenValue(token, language)
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

  const renderString = (message, language) => {
    if (_.isEmpty(message)) {
      return message;
    }
    // extract tokens
    let tokens = message.match(/\{\{([A-Za-z0-9\-\._]*?)\}\}/g);
    if (tokens != null && tokens.length != 0) {
      tokens = tokens.map(token => token.replace('{{', '').replace('}}', ''));
    }
    // replace them
    return replaceTokens(message, tokens, language);
  }

  const renderObject = (item, language) => {
    let task = when(true);
    const result = {};
    return new Promise(resolve => {
      _(item).each((value, key) => {
        task = task
          .then(() => renderItem(value, language))
          .then(translated => result[key] = translated);
      });
      task.then(() => resolve(result));
    });
  };

  const renderArray = (item, language) => {
    let task = when(true);
    const result = [];
    return new Promise(resolve => {
      _(item).each(value => {
        task = task
          .then(() => renderItem(value, language))
          .then(translated => result.push(translated));
      });
      task.then(() => resolve(result));
    });
  }

  const renderItem = (item, language) => {
    if (_.isString(item)) {
      return renderString(item, language);
    } else if (!options.preserveNumbers && _.isNumber(item)) {
      return renderString(String(item), language);
    } else if (options.preserveNumbers && _.isNumber(item)) {
      return item;
    } else if (_.isArray(item)) {
      return renderArray(item, language);
    } else if (item instanceof Buffer) {
      return when(item); // leave buffers untouched
    } else if (_.isObject(item)) {
      return renderObject(item, language);
    }
    return when(item);
  }

  const template = function() {
    const toTranslate = Array.prototype.slice.call(arguments, 0);
    const chatContext = msg.chat();

    return new Promise(resolve => {
      const translated = [];
      let language;
      let task = when(chatContext.get('language'))
        .then(lang => language = !_.isEmpty(lang) ? lang : 'en');
      // translate each element of the array
      _(toTranslate).each(sentence => {
        task = task
          .then(() => renderItem(sentence, language))
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
  };

  // evaluate a single string
  template.evaluate = async function(token) {
    const chatContext = msg.chat();
    const language = await when(chatContext.get('language'));
    const result = await renderString(token, language);
    return result;
  };

  return template;
};
