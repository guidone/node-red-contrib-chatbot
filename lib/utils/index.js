const _ = require('lodash');

const lcd = require('../lcd/index');
const md5 = require('md5');



module.exports = {

  hash(rawPassword, options = {}) {
    const salt = options.salt ? options.salt : new Date().getTime();
    const rounds = options.rounds ? options.rounds : 10;
    let hashed = md5(rawPassword + salt);
    for (let i = 0; i <= rounds; i++) {
      hashed = md5(hashed);
    }
    return `${salt}$${rounds}$${hashed}`;
  },

  isValidMessage: function(msg, node) {
    if (msg.originalMessage == null || msg.originalMessage.transport == null) {
      lcd.title('Warning: Invalid input message' + (node != null ? ' (id:' + node.id + ')' : ''));
      // eslint-disable-next-line no-console
      console.log(lcd.warn('An invalid message was sent to a RedBot node'));
      // eslint-disable-next-line no-console
      console.log(lcd.grey('RedBot nodes are able to handle messages that are originated from a RedBot node, specifically a'
        + ' receiver node (Telegram Receive, Facebook Receiver, etc.) or a Conversation node.'));
      // eslint-disable-next-line no-console
      console.log(lcd.grey('If you are receiving this it\'s likely because the flow is trying to start a conversation with'
        + ' the chatbot user without adding a "Conversation node" at the beginning of the flow. Please read here:'));
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(lcd.green('https://github.com/guidone/node-red-contrib-chatbot/wiki/Conversation-node'));
      // eslint-disable-next-line no-console
      console.log('');
      return false;
    }
    return true;
  },

  when: function (param) {
    if (param != null && _.isFunction(param.then)) {
      return param;
      // eslint-disable-next-line no-undefined
    } else if (param !== undefined) {
      return new Promise(resolve => resolve(param));
    }
    return new Promise((resolve, reject) => reject());
  },

  isSimulator(msg) {
    return msg != null && msg.originalMessage != null && msg.originalMessage.simulator === true;
  },

  /**
   * @method isCommand
   * Check if a string is a command, if specified check also that a command is the given command, not matter if there
   * are parameters
   * @param {String} msg The string to check
   * @param {String} [commandName] The command to check
   * @return {Boolean}
   */
  isCommand: function(msg, commandName) {
    if (!_.isString(msg)) {
      return false;
    }
    if (_.isEmpty(commandName)) {
      return msg.match(/^\/.*/) != null;
    } else {
      var matched = msg.match(/^\/(\w+)/);
      return matched != null && ('/' + matched[1]) === commandName;
    }
  }

};