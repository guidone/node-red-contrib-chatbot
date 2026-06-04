const FacebookServer = require('../lib/platforms/facebook/facebook');

const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory/index');

module.exports = function(RED) {

  RED.nodes.registerType(
    'chatbot-facebook-node',
    GenericBotNode(
      'facebook',
      RED,
      (node, botConfiguration) => {
        return FacebookServer.createServer({
          token: botConfiguration.token,
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

  RED.nodes.registerType('chatbot-facebook-receive', GenericInNode('facebook', RED));

  RED.nodes.registerType('chatbot-facebook-send', GenericOutNode('facebook', RED));

};
