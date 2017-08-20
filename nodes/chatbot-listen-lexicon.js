var _ = require('underscore');

var clc = require('cli-color');
var prettyjson = require('prettyjson');
var helpers = require('../lib/helpers/regexps');

var green = clc.greenBright;
var white = clc.white;
var grey = clc.blackBright;

var utils = require('../lib/helpers/utils');
var fetchers = require('../lib/helpers/fetchers');
var validators = require('../lib/helpers/validators');


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
      };

      node.send(msg);
    });
  }

  RED.nodes.registerType('chatbot-listen-lexicon', ChatBotListenLexicon);
};
