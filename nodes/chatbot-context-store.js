var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotContextStore(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    // just store the information
    node.contextStorage = config.contextStorage;
    try {
      node.contextParams = JSON.parse(config.contextParams);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Invalid JSON in context storage params (' + this.name + ')');
    }
  }

  RED.nodes.registerType('chatbot-context-store', ChatBotContextStore);


  // add an endpoint to get a list of context providers
  RED.httpNode.get('/redbot/context-providers', function(req, res) {
    var contextProviders = RED.settings.get('contextProviders');
    res.send(_(contextProviders).map(function(obj, name) {
      return {
        type: name,
        name: obj.prototype != null && !_.isEmpty(obj.prototype.name) ? obj.prototype.name : name,
        description: obj.prototype != null && !_.isEmpty(obj.prototype.description) ? obj.prototype.description : null
      }
    }));
  });

};
