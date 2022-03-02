const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotInlineQuery(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    node.personal = config.personal;
    node.caching = config.caching;
    // just store the information
    node.inlineQueryAnswer = config.inlineQueryAnswer;
    try {
      node.inlineQueryAnswer = JSON.parse(config.inlineQueryAnswer);
    } catch (e) {
      // eslint-disable-next-line no-console
      node.error('Invalid JSON for inline query answer (' + this.name + ')');
    }

    this.on('input', function(msg) {

      var inlineQueryId = msg.originalMessage != null ? msg.originalMessage.inlineQueryId : null;
      if (inlineQueryId == null) {
        node.error('The inline query id (inlineQueryId) is empty.');
        return;
      }

      var inlineQueryAnswer = utils.extractValue('arrayOfObject', 'inlineQueryAnswer', node, msg, true);
      var caching = utils.extractValue('integer', 'caching', node, msg, false);
      var personal = utils.extractValue('boolean', 'personal', node, msg, false);

      msg.payload = {
        type: 'inline-query-answer',
        content: inlineQueryAnswer,
        caching: caching,
        personal: personal
      };

      node.send(msg);
    });
  }
  registerType('chatbot-inline-query', ChatBotInlineQuery);

};
