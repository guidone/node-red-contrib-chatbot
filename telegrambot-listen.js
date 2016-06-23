var speak = require("speakeasy-nlp");
var levenshtein = require('fast-levenshtein');
var _ = require('underscore');

module.exports = function(RED) {



  function matchSentence(sentence, words) {

    // todo white list of words that need to match exactly

    _(words).each(function(word) {
      _(sentence.tokens).each(function(token) {
        console.log('word: ' + word + ' token:' + token + ' dist: '+levenshtein.get(token, word));
      });

    });


    return true;

  }


  function TelegramListen(config) {
    RED.nodes.createNode(this, config);
    var node = this;


    this.message = config.message;
    this.messageType = config.messageType;

    this.on('input', function(msg) {
      var message = node.message;
      var messageType = node.messageType;

      if (messageType == 'str') {
        if (msg.payload == message) {
          node.send(msg);
        }
      } else {
        console.log('parseggio', message);
        var words = null;
        try {
          words = JSON.parse(message);
        } catch(err) {
          node.error('Error parsing list of words.');
        }

        var analysis = speak.classify(msg.payload);

        console.log('parseggio', words);
        console.log('analisys', analysis);

        matchSentence(analysis, words);

        node.send(msg);


      }

    });
  }
  RED.nodes.registerType('telegrambot-listen', TelegramListen);

};
