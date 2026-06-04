const WhatsappServer = require('../lib/platforms/whatsapp/index');

const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory/index');

module.exports = function(RED) {

  RED.nodes.registerType(
    'chatbot-whatsapp-node',
    GenericBotNode(
      'whatsapp',
      RED,
      (node, botConfiguration) => {
        return WhatsappServer.createServer({
          token: botConfiguration.token,
          phoneNumberId: botConfiguration.phoneNumberId,
          businessAccountId: botConfiguration.businessAccountId,
          verifyToken: botConfiguration.verify_token,
          appSecret: botConfiguration.app_secret,
          contextProvider: node.contextProvider,
          debug: botConfiguration.debug,
          multiWebHook: botConfiguration.multiWebHook,
          profileFields: botConfiguration.profileFields,
          chatbotId: botConfiguration.chatbotId,
          RED: RED
        });
      },
      (config, node) => ({
        phoneNumberId: config.phoneNumberId,
        businessAccountId: config.businessAccountId,
        token: node.credentials != null && node.credentials.token != null ? node.credentials.token.trim() : null,
        verifyToken: node.credentials != null && node.credentials.verify_token != null ? node.credentials.verify_token.trim() : null,
        appSecret: node.credentials != null && node.credentials.app_secret != null ? node.credentials.app_secret.trim() : null,
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

  RED.nodes.registerType('chatbot-whatsapp-receive', GenericInNode('whatsapp', RED, { splitEvents: true }));

  RED.nodes.registerType('chatbot-whatsapp-send', GenericOutNode('whatsapp', RED));

};
