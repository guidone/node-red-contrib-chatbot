const WhatsappServer = require('../lib/platforms/whatsapp/index');
const RegisterType = require('../lib/node-installer');

const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory/index');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  registerType(
    'chatbot-whatsapp-node',
    GenericBotNode(
      'whatsapp',
      RED,
      (node, botConfiguration) => {
        console.log('botConfiguration', botConfiguration)
        return WhatsappServer.createServer({
          authorizedUsernames: botConfiguration.usernames,
          token: botConfiguration.token,
          phoneNumberId: botConfiguration.phoneNumberId,
          verifyToken: botConfiguration.verify_token,
          appSecret: botConfiguration.app_secret,
          contextProvider: node.contextProvider,
          logfile: botConfiguration.logfile,
          debug: botConfiguration.debug,
          multiWebHook: botConfiguration.multiWebHook,
          profileFields: botConfiguration.profileFields,
          chatbotId: botConfiguration.chatbotId,
          RED: RED
        });
      },
      (config, node) => ({
        usernames: config.usernames,
        phoneNumberId: config.phoneNumberId,
        token: node.credentials != null && node.credentials.token != null ? node.credentials.token.trim() : null,
        verifyToken: node.credentials != null && node.credentials.verify_token != null ? node.credentials.verify_token.trim() : null,
        appSecret: node.credentials != null && node.credentials.app_secret != null ? node.credentials.app_secret.trim() : null,
        logfile: config.log,
        profileFields: config.profileFields,
        debug: config.debug,
        multiWebHook: config.multiWebHook,
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
        app_secret: {
          type: 'text'
        },
        verify_token: {
          type: 'text'
        }
      }
    }
  );

  registerType('chatbot-whatsapp-receive', GenericInNode('whatsapp', RED));

  registerType('chatbot-whatsapp-send', GenericOutNode('whatsapp', RED));

};
