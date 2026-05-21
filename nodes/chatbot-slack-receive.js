
const SlackServer = require('../lib/platforms/slack/index');
const RegisterType = require('../lib/node-installer');
const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory/index');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  registerType(
    'chatbot-slack-node',
    GenericBotNode(
      'slack',
      RED,
      (node, botConfiguration) => {
        return SlackServer.createServer({
          botname: botConfiguration.botname,
          token: botConfiguration.token,
          appToken: botConfiguration.appToken,
          signingSecret: botConfiguration.signingSecret,
          serverPort: botConfiguration.serverPort,
          contextProvider: node.contextProvider,
          debug: botConfiguration.debug,
          useWebSocket: botConfiguration.useWebSocket,
          chatbotId: botConfiguration.chatbotId,
          RED: RED
        });
      },
      (config, node) => ({
        botname: config.botname,
        token: node.credentials != null && node.credentials.token != null ?
          node.credentials.token.trim() : null,
        appToken: node.credentials != null && node.credentials.appToken != null ?
          node.credentials.appToken.trim() : null,
        signingSecret: node.credentials != null && node.credentials.signingSecret != null ?
          node.credentials.signingSecret.trim() : null,
        serverPort: config.serverPort,
        debug: config.debug,
        useWebSocket: config.useWebSocket,
        storeMessages: config.storeMessages,
        enableMissionControl: config.enableMissionControl,
        inspectMessages: config.inspectMessages,
        chatbotId: config.chatbotId
      })
    ),
    {
      credentials: {
        token: {
          type: 'text'
        },
        appToken: {
          type: 'text'
        },
        signingSecret: {
          type: 'text'
        }
      }
    }
  );

  registerType('chatbot-slack-receive', GenericInNode('slack', RED, { splitEvents: true }));
  registerType('chatbot-slack-send', GenericOutNode('slack', RED));
};
