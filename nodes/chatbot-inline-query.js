var utils = require('../lib/helpers/utils');
var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotInlineQuery(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.personal = config.personal;
    node.caching = config.caching;

    this.on('input', function(msg) {


      var inlineQueryId = msg.originalMessage != null ? msg.originalMessage.inlineQueryId : null;

      if (_.isEmpty(inlineQueryId)) {
        node.error('The inline query id (inlineQueryId) is empty.');
        return;
      }

      var inlineQueryAnswer = utils.extractValue('arrayOfObject', 'inlineQueryAnswer', node, msg);
      var caching = utils.extractValue('integer', 'caching', node, msg);
      var personal = utils.extractValue('boolean', 'personal', node, msg);

      msg.payload = {
        type: 'inline_query_answer',
        content: inlineQueryAnswer,
        caching: caching,
        personal: personal
      };

      node.send(msg);
    });
  }
  RED.nodes.registerType('chatbot-inline-query', ChatBotInlineQuery);

};
