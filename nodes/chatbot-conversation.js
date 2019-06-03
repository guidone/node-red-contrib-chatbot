const utils = require('../lib/helpers/utils');

module.exports = function(RED) {

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

      let platformNode = null;
      if (RED.nodes.getNode(botNode) != null) {
        platformNode = RED.nodes.getNode(botNode).chat;
      }
      // check if chat is null, perhaps the node exists but it's not used by any receiver
      if (platformNode == null) {
        node.error('No active chatbot for this configuration. Means that the configuration was found but no receiver node is using it');
        return;
      }
      //let message = null;
      platformNode.createMessage(chatId, userId, null, msg)
        .then(message => node.send(message));
    });
  }

  RED.nodes.registerType('chatbot-conversation', ChatBotConversation);
};
