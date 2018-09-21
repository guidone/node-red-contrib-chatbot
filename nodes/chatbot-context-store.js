var _ = require('underscore');
var ChatPlatform = require('../lib/chat-platform/chat-platform');

module.exports = function(RED) {

  function ChatBotContextStore(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    // just store the information
    node.contextStorage = config.contextStorage;
    node.contextParams = {};
    try {
      if (!_.isEmpty(config.contextParams)) {
        node.contextParams = JSON.parse(config.contextParams);
      }
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

  // add an endpoint to get a list of context providers
  RED.httpNode.get('/redbot/globals', function(req, res) {
    var keys = RED.settings.functionGlobalContext.keys();
    var result = {};
    keys.forEach(function(key) {
      result[key] = RED.settings.functionGlobalContext.get(key);
    });
    // collect message types
    result.messageTypes = _(ChatPlatform.getMessageTypes())
      .sortBy(function(type) {
        return type.label;
      });
    res.send(result);
  });

  // add an endpoint to get a list of context providers
  RED.httpNode.get('/redbot/platforms', function(req, res) {
    var platforms = ChatPlatform.getPlatforms();
    res.send({ platforms: platforms });
  });

};
