var speak = require("speakeasy-nlp");
var levenshtein = require('fast-levenshtein');
var _ = require('underscore');

module.exports = function(RED) {

  function matchSentence(sentence, words) {

    words = _(words).map(function(word) {
      return word.toLowerCase();
    });
    var exactWords = ['yes', 'no', 'on', 'off'];

    // scan the words, all must be present
    return _(words).all(function(word) {
      if (_.contains(exactWords, word)) {
        return _.contains(sentence.tokens, word);
      } else {
        return _(sentence.tokens).some(function(token) {
          return levenshtein.get(token, word) <= 2;
        });
      }
    });
  }

  function ChatBotListen(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.messageType = config.messageType;

    this.on('input', function(msg) {
      var message = node.message;
      var messageType = node.messageType;

      // exit if not string
      if (!_.isString(msg.payload.content)) {
        return;
      }

      if (messageType == 'str') {
        if (msg.payload != null && msg.payload.content == message) {
          node.send(msg);
        }
      } else {
        // check if valid json
        var words = null;
        try {
          words = JSON.parse(message);
        } catch(err) {
          node.error('Error parsing list of words. Only valid JSON like ["word1","word2"], remember to use " and not \'.');
        }
        // check if array
        if (!_.isArray(words)) {
          node.error('List of words must be an array. Something like ["word1","word2"], remember to use " and not \'.');
          return;
        }
        // analize sentence
        var analysis = speak.classify(msg.payload.content);

        // send message if the sentence is matched, otherwise stop here
        if (matchSentence(analysis, words)) {
          node.send(msg);
        }

      }

    });
  }
  RED.nodes.registerType('chatbot-listen', ChatBotListen);

};
