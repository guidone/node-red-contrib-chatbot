var levenshtein = require('fast-levenshtein');
var _ = require('underscore');
var regexps = require('./lib/helpers/regexps.js');
var NplMatcher = require('./lib/npl-matcher');
var clc = require('cli-color');
var prettyjson = require('prettyjson');

var green = clc.greenBright;
var white = clc.white;
var grey = clc.blackBright;

module.exports = function(RED) {

  function ChatBotListen(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.rules = config.rules;
    this.showdebug = config.showdebug;

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var chatContext = msg.chat();

      var rules = node.rules;
      var debug = node.showdebug;

      // do nothing if it's not a chat message
      if (originalMessage == null || _.isEmpty(rules)) {
        return;
      }

      var output = [];
      var matched = false;

      // parse incoming message
      var message = msg.payload.content;
      var terms = NplMatcher.parseSentence(message);

      // debug the terms
      if (debug) {
        console.log('');
        console.log(grey('------ Sentence Analysis ----------------'));
        console.log(green('Message:'), white(message));
        try {
          console.log(prettyjson.render(terms._terms));
        } catch(e) {
          // pretty json may breaks
        }
      }

      rules.forEach(function(rule) {
        if (!matched && rule === '*') {
          // mark as matched, only the first wins
          matched = true;
          output.push(msg);
        } else if (!matched && (matchedRule = NplMatcher.matchRule(terms, new NplMatcher.MatchRules(rule.split(',')))) != null) {
          // mark as matched, only the first wins
          matched = true;
          // store variables
          matchedRule.forEach(function(rule) {
            if (!_.isEmpty(rule.variable)) {
              chatContext.set(rule.variable, rule.value);
            }
          });

          output.push(msg);
        } else {
          output.push(null);
        }
      });
      node.send(output);

    });
  }

  RED.nodes.registerType('chatbot-listen', ChatBotListen);
};
