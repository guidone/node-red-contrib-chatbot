const _ = require('underscore');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotTelegramrMenu(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.bot = config.bot;
    this.items = config.items;

    const validCommands = items => {
      return _.isArray(items) && !_.isEmpty(items) && items.every(item => _.isObject(item) && !_.isEmpty(item.command));
    };

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      done = done || function(error) { node.error.call(node, error, msg) };
      // check bot
      if (node.bot == null) {
        done('Missing Telegram Bot configuration');
        return;
      }
      const currentBot = RED.nodes.getNode(node.bot);
      if (currentBot == null || currentBot.chat == null) {
        done('Invalid Telegram Bot configuration');
        return;
      }
      const { connector } = currentBot.chat.getOptions();
      // get items
      let items;
      if (validCommands(node.items)) {
        items = node.items;
      } else if (validCommands(msg.commands)) {
        items = msg.commands;
      } else {
        done('Invalid commands, "command" parameter is required');
        return;
      }
      // finally set the commands
      try {
        await connector.setMyCommands(items);
        done();
      } catch(e) {
        done('Error setting commands in Telegram bot');
      }
    });
  }

  registerType('chatbot-telegram-menu', ChatBotTelegramrMenu);
};
