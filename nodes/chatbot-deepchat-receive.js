const _ = require('lodash');

const DeepChatServer = require('../lib/platforms/deepchat');
const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory/index');

// empty string means "use the platform default"
const toInt = (value, defaultValue) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

module.exports = function(RED) {

  RED.nodes.registerType(
    'chatbot-deepchat-node',
    GenericBotNode(
      'deepchat',
      RED,
      (node, botConfiguration) => {
        return DeepChatServer.createServer({
          botId: botConfiguration.botId,
          botname: botConfiguration.botname,
          publicUrl: botConfiguration.publicUrl,
          allowedOrigins: botConfiguration.allowedOrigins,
          introMessage: botConfiguration.introMessage,
          acceptFiles: botConfiguration.acceptFiles,
          cdn: botConfiguration.cdn,
          timeout: botConfiguration.timeout,
          collectWindow: botConfiguration.collectWindow,
          contextProvider: node.contextProvider,
          debug: botConfiguration.debug,
          chatbotId: botConfiguration.chatbotId,
          RED: RED
        });
      },
      (config, node) => ({
        botId: !_.isEmpty(config.botId) ? config.botId.trim() : null,
        botname: node.botname,
        publicUrl: config.publicUrl,
        allowedOrigins: config.allowedOrigins,
        introMessage: config.introMessage,
        acceptFiles: config.acceptFiles !== false,
        cdn: config.cdn,
        timeout: toInt(config.timeout, undefined),
        collectWindow: toInt(config.collectWindow, undefined),
        debug: config.debug,
        storeMessages: config.storeMessages,
        enableMissionControl: config.enableMissionControl,
        inspectMessages: config.inspectMessages,
        chatbotId: config.chatbotId
      }),
      botConfiguration => !_.isEmpty(botConfiguration.botId)
    )
  );

  RED.nodes.registerType('chatbot-deepchat-receive', GenericInNode('deepchat', RED));

  RED.nodes.registerType('chatbot-deepchat-send', GenericOutNode('deepchat', RED));
};
