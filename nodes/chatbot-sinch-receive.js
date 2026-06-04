const SinchServer = require('../lib/platforms/sinch');
const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory/index');

module.exports = function(RED) {

  RED.nodes.registerType(
    'chatbot-sinch-node',
    GenericBotNode(
      'sinch',
      RED,
      (node, botConfiguration) => {
        return SinchServer.createServer({
          projectId: botConfiguration.projectId,
          appId: botConfiguration.appId,
          keyId: botConfiguration.keyId,
          keySecret: botConfiguration.keySecret,
          region: botConfiguration.region,
          contextProvider: node.contextProvider,
          debug: botConfiguration.debug,
          chatbotId: botConfiguration.chatbotId,
          RED: RED
        });
      },
      (config, node) => ({
        projectId: config.projectId,
        appId: config.appId,
        keyId: node.credentials != null && node.credentials.keyId != null ?
          node.credentials.keyId.trim() : null,
        keySecret: node.credentials != null && node.credentials.keySecret != null ?
          node.credentials.keySecret.trim() : null,
        region: config.region,
        debug: config.debug,
        storeMessages: config.storeMessages,
        enableMissionControl: config.enableMissionControl,
        inspectMessages: config.inspectMessages,
        chatbotId: config.chatbotId
      }),
      botConfiguration => botConfiguration.projectId != null
        && botConfiguration.appId != null
        && botConfiguration.keyId != null
        && botConfiguration.keySecret != null
    ),
    {
      credentials: {
        keyId: {
          type: 'text'
        },
        keySecret: {
          type: 'password'
        }
      }
    }
  );

  RED.nodes.registerType('chatbot-sinch-receive', GenericInNode('sinch', RED));

  RED.nodes.registerType('chatbot-sinch-send', GenericOutNode('sinch', RED));
};
