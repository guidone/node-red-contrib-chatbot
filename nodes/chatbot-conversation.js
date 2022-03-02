const _ = require('underscore');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');
const { UniversalPlatform, ContextProviders } = require('chat-platform');

const isEmpty = value => _.isEmpty(value) && !_.isNumber(value);

const {
  extractValue
} = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    globalContextHelper.init(this.context().global);
    const global = this.context().global;

    this.chatId = config.chatId;
    this.userId = config.userId;
    this.transport = config.transport;
    this.store = config.store;
    this.botProduction = config.botProduction;
    this.botDevelopment = config.botDevelopment;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // get config
      const chatId = extractValue('stringOrNumber', 'chatId', node, msg, false);
      const userId = extractValue('stringOrNumber', 'userId', node, msg, false);

      // get from config, but check also params
      let botNode = global.environment === 'production' ? node.botProduction : node.botDevelopment;
      if (msg != null && _.isString(msg.botNode) && !_.isEmpty(msg.botNode)) {
        botNode = msg.botNode;
      } else if (msg != null && msg.payload != null && _.isString(msg.payload.botNode) && !_.isEmpty(msg.payload.botNode)) {
        botNode = msg.payload.botNode;
      }

      // check userId or chatId
      if (isEmpty(chatId) && isEmpty(userId)) {
        done('Both chatId and userId are empty');
        return;
      } else if (!isEmpty(chatId) && isEmpty(botNode)) {
        done('chatId was correctly specified but without a valid chatbot configuration');
        return;
      }

      // get the platform
      let platformNode;
      if (RED.nodes.getNode(botNode) != null) {
        platformNode = RED.nodes.getNode(botNode).chat;
      } else {
        const contextProvider = ContextProviders.getProviderById(this.store);
        if (contextProvider == null) {
          done('Unable to find a valid chat context instance for the selected context provider');
          return;
        }
        platformNode = UniversalPlatform.createServer({ contextProvider });
      }
      // check if chat is null, perhaps the node exists but it's not used by any receiver
      if (platformNode == null) {
        done('No active chatbot for this configuration. Means that the configuration was found but no receiver node is using it');
        return;
      }

      // finally send
      const message = await platformNode.createMessage(chatId, userId, null, msg)
      send({ ...msg, ...message });
      done();
    });
  }

  registerType('chatbot-conversation', ChatBotConversation);
};
