const _ = require('lodash');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');
const { extractValue } = require('../lib/helpers/utils');

// Telegram only accepts two-letter ISO 639-1 codes for localized bot commands, strip the region
// subtag (i.e. "pt-BR" or "en_US") which is usually present in the user's language from chat context
const normalizeLanguage = language => language.trim().toLowerCase().split(/[-_]/)[0];
const isValidLanguage = language => /^[a-z]{2}$/.test(language);

module.exports = function(RED) {
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotTelegramrMenu(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.bot = config.bot;
    this.items = config.items;
    this.language = config.language;

    const validCommands = items => {
      return _.isArray(items) && !_.isEmpty(items) && items.every(item => _.isObject(item) && !_.isEmpty(item.command));
    };

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      done = done || function(error) { node.error.call(node, error, msg) };

      let botNode = node.bot;
      if (msg != null && _.isString(msg.botNode) && !_.isEmpty(msg.botNode)) {
        botNode = msg.botNode;
      } else if (msg != null && msg.payload != null && _.isString(msg.payload.botNode) && !_.isEmpty(msg.payload.botNode)) {
        botNode = msg.payload.botNode;
      }
      // check bot node
      if (_.isEmpty(botNode)) {
        done('Missing Telegram Bot configuration');
        return;
      }
      const currentBot = RED.nodes.getNode(botNode);
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
      // get the language (config first, then msg.language), if empty the commands are the default
      // ones, shown to all users whose language has no dedicated commands
      const form = {};
      const language = extractValue('string', 'language', node, msg, false, true);
      if (language != null) {
        form.language_code = normalizeLanguage(language);
        if (!isValidLanguage(form.language_code)) {
          done(`Invalid language "${language}", must be a two-letter ISO 639-1 code (i.e. "en", "it")`);
          return;
        }
      }
      // finally set the commands
      try {
        await connector.setMyCommands(items, form);
        done();
      } catch(e) {
        done(`Error setting commands in Telegram bot: ${e != null && e.message != null ? e.message : e}`);
      }
    });
  }

  RED.nodes.registerType('chatbot-telegram-menu', ChatBotTelegramrMenu);
};
