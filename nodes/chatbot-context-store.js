const _ = require('underscore');
const { ChatExpress: ChatPlatform } = require('chat-platform');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);
  const isMissionControlEnabled = require('../lib/helpers/is-mc-enabled')(RED);

  function ChatBotContextStore(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
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
  registerType('chatbot-context-store', ChatBotContextStore);

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
  RED.httpNode.get('/redbot/globals', async function(req, res) {
    const keys = globalContextHelper.keys();
    const result = {};
    // get all configurations in the global settings
    ChatPlatform.getPlatforms().forEach(platform => result[platform.id] = globalContextHelper.get(platform.id));
    // list of master nodes in the flow
    keys.forEach(key => {
      if (!key.startsWith('chatbot_info_') && !key.startsWith('nlp_')) {
        result[key] = globalContextHelper.get(key);
      }
    });
    // get all chatbotIds used in simulator
    result.simulatorChatbotIds = [];
    RED.nodes.eachNode(n => {
      if (n.type === 'mc-simulator-receiver' && !result.simulatorChatbotIds.includes(n.chatbotId)) {
        result.simulatorChatbotIds.push(n.chatbotId);
      }
    });
    // get a list of running chatbots in the flow
    result.activeChatbots = keys
      .filter(key => key.startsWith('chatbot_info_'))
      .map(key => globalContextHelper.get(key))
    // collect message types
    result.messageTypes = _(ChatPlatform.getMessageTypes()).sortBy(type => type.label);
    // collect events
    result.eventTypes = _(ChatPlatform.getEvents()).sortBy(event => event.name);
    // collect params
    result.params = ChatPlatform.getParams();
    // add port
    result.uiPort = RED.settings.uiPort;
    // if mc is installed
    result.missionControl = isMissionControlEnabled();
    res.send(result);
  });

  // add an endpoint to get a list of context providers
  RED.httpNode.get('/redbot/platforms', function(req, res) {
    var platforms = ChatPlatform.getPlatforms();
    res.send({ platforms: platforms });
  });

  // add an endpoint to get a list of context providers
  RED.httpNode.get('/redbot/platforms/classes', function(req, res) {
    var platforms = ChatPlatform.getPlatforms();
    res.send({
      platforms: _(platforms).filter(function(platform) {
        return !platform.universal;
      })
    });
  });

};
