var _ = require('underscore');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotListenLexicon(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.values = config.values;
    this.name = config.name;
    this.showdebug = config.showdebug;

    this.on('input', function(msg) {

      var values = utils.extractValue('array', 'values', node, msg);
      var name = utils.extractValue('string', 'name', node, msg);

      var currentLexicon = msg.payload != null && _.isObject(msg.payload.lexicon) ? msg.payload.lexicon : {};
      // collect the lexicon of the node and mix with the one of the incoming payload
      if (_.isArray(values) && !_.isEmpty(values)) {
        var partial = {};
        _(values).each(function(value) {
          partial[value] = name;
        });
        _.extend(currentLexicon, partial);
        if (msg.payload == null) {
          msg.payload = {};
        }
        msg.payload.lexicon = currentLexicon;
      }

      node.send(msg);
    });
  }

  RED.nodes.registerType('chatbot-listen-lexicon', ChatBotListenLexicon);
};
