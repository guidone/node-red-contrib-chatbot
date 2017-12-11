var ChatLog = require('../lib/chat-log.js');
var utils = require('../lib/helpers/utils');
var when = utils.when;

module.exports = function(RED) {

  function ChatBotInlineQuery(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {

      // todo check if there's a inline query id

      var inlineQueryAnswer = utils.extractValue('arrayOfObject', 'inlineQueryAnswer', node, msg);

      msg.payload = {
        type: 'inline_query_answer',
        content: inlineQueryAnswer
      };

      node.send(msg);

    });
  }
  RED.nodes.registerType('chatbot-inline-query', ChatBotInlineQuery);

};
