
const SlackServer = require('../lib/platforms/slack/index');
const RegisterType = require('../lib/node-installer');
const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory');

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
          authorizedUsernames: botConfiguration.usernames,
          token: botConfiguration.token,
          signingSecret: botConfiguration.signingSecret,
          serverPort: botConfiguration.serverPort,
          contextProvider: node.contextProvider,
          logfile: botConfiguration.logfile,
          debug: botConfiguration.debug,
          username: botConfiguration.username,
          iconEmoji: botConfiguration.iconEmoji,
          RED: RED
        });
      },
      (config, node) => ({
        usernames: config.usernames,
        botname: config.botname,
        token: node.credentials != null && node.credentials.token != null ? node.credentials.token.trim() : null,
        signingSecret: node.credentials != null && node.credentials.signingSecret != null ? node.credentials.signingSecret.trim() : null,
        serverPort: config.serverPort,
        debug: config.debug,
        logfile: config.log,
        username: config.username,
        iconEmoji: config.iconEmoji
      })
    ),
    {
      credentials: {
        token: {
          type: 'text'
        },
        signingSecret: {
          type: 'text'
        }
      }
    }
  );

  registerType('chatbot-slack-receive', GenericInNode('slack', RED));

  registerType('chatbot-slack-send', GenericOutNode('slack', RED));

};
