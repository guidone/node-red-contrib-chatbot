var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotInlineQuery(config) {
    RED.nodes.createNode(this, config);
    var node = this;
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
  RED.nodes.registerType('chatbot-inline-query', ChatBotInlineQuery);

};
