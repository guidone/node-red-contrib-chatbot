const _ = require('underscore');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotNLPIntent(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.utterances = config.utterances;
    this.intent = config.intent;
    this.language = config.language;

    this.on('input', function(msg, send, done) {

      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const utterances = utils.extractValue('arrayOfString', 'utterances', node, msg);
      const intent = utils.extractValue('string', 'intent', node, msg, false);
      const language = utils.extractValue('string', 'language', node, msg, false);

      msg.payload = _.isObject(msg.payload) ? msg.payload : {}; 
      // collect the lexicon of the node and mix with the one of the incoming payload
      if (_.isArray(utterances) && !_.isEmpty(utterances)) {
        // append utterances
        if (msg.payload.intents == null) {
          msg.payload.intents = {};
        }
        if (msg.payload.intents[language] == null) {
          msg.payload.intents[language] = {};
        }
        if (msg.payload.intents[language][intent] == null) {
          msg.payload.intents[language][intent] = {};
        }
        msg.payload.intents[language][intent] = [
          ...(_.isArray(msg.payload.intents[language][intent]) ? msg.payload.intents[language][intent] : []),
          ...utterances
        ]
      }

      node.send(msg);
      done();
    });
  }

  registerType('chatbot-nlpjs-intent', ChatBotNLPIntent);
};
