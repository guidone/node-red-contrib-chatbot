const _ = require('underscore');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

const parseButtons = require('../lib/platforms/facebook/parse-buttons');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotMessengerMenu(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    globalContextHelper.init(this.context().global);
    this.items = config.items;
    this.command = config.command;
    this.composerInputDisabled = config.composerInputDisabled;
    this.bot = config.bot;

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
        done('Missing Facebook Bot configuration');
        return;
      }
      const currentBot = RED.nodes.getNode(botNode);
      if (currentBot == null || currentBot.chat == null) {
        done('Invalid Facebook Bot configuration');
        return;
      }

      if (node.command === 'set') {
        const items = parseButtons(node.items);
        // for some reason the called the same button as web_url and not url
        items.forEach(function (item) {
          item.type = item.type === 'url' ? 'web_url' : item.type;
        });
        await currentBot.chat.setPersistentMenu(items, node.composerInputDisabled);
      } else if (node.command === 'delete') {
        await currentBot.chat.removePersistentMenu();
      }

      node.send(msg);
    });
  }

  registerType('chatbot-messenger-menu', ChatBotMessengerMenu);
};
