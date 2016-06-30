var speak = require("speakeasy-nlp");
var levenshtein = require('fast-levenshtein');
var _ = require('underscore');
var debug = false;

module.exports = function(RED) {

  function getDistance(word) {
    if (word.length <= 2) {
      return 0
    } else if (word.length <=4) {
      return 1;
    } else {
      return 2;
    }
  }

  function matchSentence(sentence, words) {

    words = _(words).map(function(word) {
      return word.toLowerCase();
    });
    var exactWords = ['yes', 'no', 'on', 'off'];

    debug && console.log('tokens - ', sentence.tokens);

    // scan the words, all must be present
    var result = _(words).all(function(word) {

      if (_.contains(exactWords, word)) {
        debug && console.log('contain exact', _.contains(sentence.tokens, word));
        return _.contains(sentence.tokens, word);
      } else {
        return _(sentence.tokens).some(function(token) {
          debug && console.log('* Levenshtein ', token, word, levenshtein.get(token, word) <= getDistance(word));
          // distance depends on length of the word to check
          return levenshtein.get(token, word) <= getDistance(word);
        });
      }
    });

    debug && console.log('- MATCHED ', words, '---> ', result);

    return result;
  }

  function ChatBotListen(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.sentences = config.sentences;

    this.on('input', function(msg) {
      var sentences = node.sentences;

      // exit if not string
      if (!_.isString(msg.payload.content)) {
        return;
      }
      debug && console.log('Searching match for ', msg.payload.content);

      // see if one of the rules matches
      var matched = _(sentences).any(function(sentence) {
        if (sentence.type == 'str') {
          if (msg.payload.content == sentence.value) {
            return true;
          }
        } else {
          // check if valid json
          var words = null;

          try {
            words = JSON.parse(sentence.value);
          } catch(err) {
            node.error('Error parsing list of words. Only valid JSON like ["word1","word2"], remember to use " and not \'.');
          }
          // check if array
          if (!_.isArray(words)) {
            node.error('List of words must be an array. Something like ["word1","word2"], remember to use " and not \'.');
            return;
          }
          debug && console.log('---- START analisys ' + msg.payload.content);
          // analize sentence
          var analysis = speak.classify(msg.payload.content);
          // send message if the sentence is matched, otherwise stop here
          return matchSentence(analysis, words);
        }
      });
      // pass through the message if any of the above matched
      if (matched) {
        node.send(msg);
      }

    });
  }
  RED.nodes.registerType('chatbot-listen', ChatBotListen);

};
