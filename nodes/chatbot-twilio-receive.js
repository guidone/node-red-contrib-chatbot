const TwilioServer = require('../lib/platforms/twilio/twilio');
const RegisterType = require('../lib/node-installer');
const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  registerType(
    'chatbot-twilio-node',
    GenericBotNode(
      'twilio',
      RED,
      (node, botConfiguration) => {
        return TwilioServer.createServer({
          authorizedUsernames: botConfiguration.usernames,
          authToken: botConfiguration.authToken,
          accountSid: botConfiguration.accountSid,
          fromNumber: botConfiguration.fromNumber,
          contextProvider: node.contextProvider,
          logfile: botConfiguration.logfile,
          debug: botConfiguration.debug,
          RED: RED
        });
      },
      (config, node) => ({
        usernames: config.usernames,
        authToken: node.credentials != null && node.credentials.authToken != null ? node.credentials.authToken.trim() : null,
        accountSid: config.accountSid,
        fromNumber: config.fromNumber,
        logfile: config.log,
        debug: config.debug
      }),
      botConfiguration => botConfiguration.authToken != null
    ),
    {
      credentials: {
        authToken: {
          type: 'text'
        }
      }
    }
  );

  registerType('chatbot-twilio-receive', GenericInNode('twilio', RED));

  registerType('chatbot-twilio-send', GenericOutNode('twilio', RED));
};
