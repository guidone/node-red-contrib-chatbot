const utils = require('../lib/helpers/utils');
const helpers = require('../lib/helpers/regexps');
const _ = require('underscore');
const RegisterType = require('../lib/node-installer');

const when = utils.when;


module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotParams(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var global = this.context().global;
    node.rules = config.rules;

    this.on('input', function(msg) {
      var rules = utils.extractValue('arrayOfObject', 'rules', node, msg, true);
      
    });
  }

  registerType('chatbot-params', ChatBotParams);
};
