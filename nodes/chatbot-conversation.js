const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const { UniversalPlatform, ContextProviders } = require('chat-platform');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const global = this.context().global;

    this.chatId = config.chatId;
    this.userId = config.userId;
    this.transport = config.transport;
    this.store = config.store;
    this.botProduction = config.botProduction;
    this.botDevelopment = config.botDevelopment;

    this.on('input', msg => {
      const chatId = utils.extractValue('string', 'chatId', node, msg, false)
      const userId = utils.extractValue('string', 'userId', node, msg, false)
        || utils.extractValue('number', 'userId', node, msg, false);

      const botNode = global.environment === 'production' ? node.botProduction : node.botDevelopment;

      let platformNode;
      if (RED.nodes.getNode(botNode) != null) {
        platformNode = RED.nodes.getNode(botNode).chat;
      } else {
        const contextProvider = ContextProviders.getProviderById(this.store);
        if (contextProvider == null) {
          node.error('Unable to find a valid chat context instance for the selected context provider');
          return;
        }
        platformNode = UniversalPlatform.createServer({ contextProvider });
      }

      // check if chat is null, perhaps the node exists but it's not used by any receiver
      if (platformNode == null) {
        node.error('No active chatbot for this configuration. Means that the configuration was found but no receiver node is using it');
        return;
      }
      // finally send
      platformNode.createMessage(chatId, userId, null, msg)
        .then(message => node.send(message));

    });
  }

  registerType('chatbot-conversation', ChatBotConversation);
};
