var speak = require("speakeasy-nlp");
var levenshtein = require('fast-levenshtein');
var ChatContext = require('./lib/chat-context.js');
var _ = require('underscore');
var regexps = require('./lib/helpers/regexps.js');
var debug = false;

module.exports = function(RED) {

  var fixedWords = ['yes', 'no', 'on', 'off'];
  var tokenVariables = ['{{email}}'];

  function isFixedWord(word) {
    return _.contains(fixedWords, word);
  }

  function isTokenVariable(word) {
    return _.contains(tokenVariables, word);
  }

  /**
   * @method getDistance
   * Get the Levenshtein distance based on the length of the word, for length = 2 distance must be 0 or "off" and "on"
   * will be confused
   */
  function getDistance(word) {
    if (word.length <= 2) {
      return 0
    } else if (word.length <= 4) {
      return 1;
    } else {
      return 2;
    }
  }

  /**
   * @method matchSentence
   * Given the analysis to a sentence, check the all the provided words match with the sentence
   * @param {Object} sentence
   * @param {Array} words
   * @param {ChatContext} chatContext
   */
  function matchSentence(sentence, words, chatContext) {
    // convert all words lowercase
    words = _(words).map(function(word) {
      return word.toLowerCase();
    });


    debug && console.log('tokens - ', sentence.tokens);
    debug && console.log('analysis - ', sentence);

    // scan the words, all must be present
    var result = _(words).all(function(word) {

      if (isFixedWord(word)) {
        debug && console.log('contain exact', _.contains(sentence.tokens, word));
        return _.contains(sentence.tokens, word);
      } else if (isTokenVariable(word)) {
        // get the right matcher
        var variable = word.replace('{{', '').replace('}}', '');
        var test = regexps[variable];
        var found = null;
        // search if in the tokens something is matching
        var matched = _(sentence.tokens).some(function(token) {
          return (found = test(token)) != null;
        });
        // store in chat context if any
        if (found != null) {
          chatContext.set(variable, found);
        }
        return matched;
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
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var context = node.context();
      var chatContext = context.flow.get('chat:' + chatId) || ChatContext(chatId);

      // exit if not string
      if (!_.isString(msg.payload.content)) {
        return;
      }
      debug && console.log('Searching match for ', msg.payload.content);

      // see if one of the rules matches
      var matched = _(sentences).any(function(sentence) {

        // check if valid json
        var words = sentence.split(',');

        debug && console.log('---- START analysis ' + msg.payload.content);
        // analize sentence
        var analysis = speak.classify(msg.payload.content);
        // send message if the sentence is matched, otherwise stop here
        return matchSentence(analysis, words, chatContext);
      });
      // pass through the message if any of the above matched
      if (matched) {
        node.send(msg);
      }

    });
  }
  RED.nodes.registerType('chatbot-listen', ChatBotListen);

};
