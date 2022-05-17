const GetEnvironment = require('./get-environment');

module.exports = function(RED) {
  const getEnvironment = GetEnvironment(RED);

  const isConfigurationForEnvironment = (nodeId, environemt) => {
    let result = false;
    RED.nodes.eachNode(n => {
      if ((environemt === 'development' && n.bot === nodeId) ||
      (environemt === 'production' && n.botProduction === nodeId)) {
        result = true;
      }
    });
    return result;
  };

  /**
   * getConfigurationNode
   * Get the configuration node give the chatbotId (also checks the right environment)
   * @param {string} chatbotId
   * @returns Object
   */
  const getConfigurationNode = chatbotId => {
    let serverNode;
    const environment = getEnvironment();
    RED.nodes.eachNode(n => {
      if (n.type.startsWith('chatbot-') &&
        n.type.endsWith('-node') &&
        n.chatbotId === chatbotId &&
        isConfigurationForEnvironment(n.id, environment)
      ) {
        serverNode = RED.nodes.getNode(n.id);
        }
    });
    return serverNode;
  }

  return getConfigurationNode;
};