const TelegramServer = require('../lib/platforms/telegram');
const RegisterType = require('../lib/node-installer');
const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  registerType(
    'chatbot-telegram-node',
    GenericBotNode(
      'telegram',
      RED,
      (node, botConfiguration) => {
        return TelegramServer.createServer({
          authorizedUsernames: botConfiguration.usernames,
          token: botConfiguration.token,
          providerToken: botConfiguration.providerToken,
          polling: botConfiguration.polling,
          contextProvider: node.contextProvider,
          logfile: botConfiguration.logfile,
          debug: botConfiguration.debug,
          webHook: botConfiguration.webHook,
          connectMode: botConfiguration.connectMode,
          RED: RED
        });
      },
      (config, node) => ({
        usernames: config.usernames,
        token: node.credentials != null && node.credentials.token != null ? node.credentials.token.trim() : null,
        providerToken: config.providerToken,
        polling: config.polling,
        logfile: config.log,
        debug: config.debug,
        webHook: config.webHook,
        connectMode: config.connectMode
      })
    ),
    {
      credentials: {
        token: {
          type: 'text'
        }
      }
    }
  );

  registerType('chatbot-telegram-receive', GenericInNode('telegram', RED));

  registerType('chatbot-telegram-send', GenericOutNode('telegram', RED));
};
