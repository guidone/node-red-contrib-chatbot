
const SlackServer = require('../lib/platforms/slack');
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
          oauthToken : botConfiguration.oauthToken,
          contextProvider: node.contextProvider,
          logfile: botConfiguration.logfile,
          debug: botConfiguration.debug,
          username: botConfiguration.username,
          iconEmoji: botConfiguration.iconEmoji,
          RED: RED
        });
      },
      (config, node) => ({
        botname: config.botname,
        token: node.credentials != null && node.credentials.token != null ? node.credentials.token.trim() : null,
        oauthToken: node.credentials != null && node.credentials.oauthToken != null ? node.credentials.oauthToken.trim() : null,
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
        oauthToken: {
          type: 'text'
        }
      }
    }
  );

  registerType('chatbot-slack-receive', GenericInNode('slack', RED));

  registerType('chatbot-slack-send', GenericOutNode('slack', RED));

};
