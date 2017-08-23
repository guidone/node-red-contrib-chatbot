var _ = require('underscore');
var NplMatcher = require('../lib/npl-matcher');
var helpers = require('../lib/helpers/regexps');
var utils = require('../lib/helpers/utils');

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

      var debug = utils.extractValue('boolean', 'showdebug', node, msg);
      var lexicon = utils.extractValue('hash', 'lexicon', node, msg);

      // do nothing if it's not a chat message
      if (originalMessage == null || _.isEmpty(rules)) {
        return;
      }

      var output = [];
      var matched = false;

      // parse incoming message
      var message = msg.payload.content;
      var terms = NplMatcher.parseSentence(message, lexicon, debug);

      // do not try to parse if it's a command like
      if (helpers.isCommand(message)) {
        return;
      }

      rules.forEach(function(rule) {
        var matchedRule = null;
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
