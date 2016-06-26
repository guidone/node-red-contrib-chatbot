var speak = require("speakeasy-nlp");
var levenshtein = require('fast-levenshtein');
var _ = require('underscore');
var lngDetector = new (require('languagedetect'));

module.exports = function(RED) {

  function ChatBotAnalyze(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.messageType = config.messageType;

    this.on('input', function(msg) {

      // exit if not string
      if (_.isString(msg.payload.content)) {
        msg.analysis = speak.classify(msg.payload.content);
        var matchLanguage = lngDetector.detect(msg.payload.content, 2);
        msg.analysis.language = _.isArray(matchLanguage) && !_.isEmpty(matchLanguage) ? matchLanguage[0][0] : null;
      }

      node.send(msg);
    });
  }
  RED.nodes.registerType('chatbot-analyze', ChatBotAnalyze);

};
