var _ = require('underscore');
var NplMatcher = require('./lib/npl-matcher');
var clc = require('cli-color');
var prettyjson = require('prettyjson');
var helpers = require('./lib/helpers/regexps');

var green = clc.greenBright;
var white = clc.white;
var grey = clc.blackBright;

module.exports = function(RED) {

  function ChatBotListenLexicon(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.rules = config.rules;
    this.showdebug = config.showdebug;

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var chatContext = msg.chat();


      node.send(msg);

    });
  }

  RED.nodes.registerType('chatbot-listen-lexicon', ChatBotListenLexicon);
};
