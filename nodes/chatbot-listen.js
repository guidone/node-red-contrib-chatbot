var _ = require('underscore');
var NplMatcher = require('../lib/npl-matcher');
var helpers = require('../lib/helpers/regexps');
var utils = require('../lib/helpers/utils');
var when = utils.when;
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
      var task = new Promise(function(resolve) {
        resolve();
      });
      var rules = node.rules;
      var output = [];
      var matched = false;

      var debug = utils.extractValue('boolean', 'showdebug', node, msg);
      var lexicon = utils.extractValue('hash', 'lexicon', node, msg);

      // do nothing if it's not a chat message
      if (originalMessage == null || _.isEmpty(rules)) {
        return;
      }
      if (msg.payload != null && msg.payload.inbound === false) {
        if (debug) {
          // eslint-disable-next-line no-console
          console.log('Message is outbound, skip parsing.');
        }
        return;
      }

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
          var storeVariables = {};
          matchedRule.forEach(function(rule) {
            if (!_.isEmpty(rule.variable)) {
              //chatContext.set(rule.variable, rule.value);
              storeVariables[rule.variable] = rule.value;
            }
          });
          if (debug) {
            // eslint-disable-next-line no-console
            console.log('--------------');
            console.log(green('Matched rule:'), grey(rule));
            console.log(green('Extracted variables:'));
            console.log(prettyjson.render(storeVariables));
            console.log('');
          }
          // store async
          if (!_.isEmpty(storeVariables)) {
            task = task.then(function () {
              return when(chatContext.set(storeVariables));
            });
          }
          // push out the message in the right route
          output.push(msg);
        } else {
          output.push(null);
        }
      });
      // finally send
      task.then(function() {
        node.send(output);
      });
    });
  }

  RED.nodes.registerType('chatbot-listen', ChatBotListen);
};
