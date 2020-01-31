const _ = require('underscore');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotNLPEntity(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.entities = config.entities;
    this.name = config.name;
    this.language = config.language;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const entities = utils.extractValue('arrayOfEntities', 'entities', node, msg);
      const name = utils.extractValue('string', 'name', node, msg, false);
      const language = utils.extractValue('string', 'language', node, msg, false);

      msg.payload = _.isObject(msg.payload) ? msg.payload : {}; 
      // collect the lexicon of the node and mix with the one of the incoming payload
      if (_.isArray(entities) && !_.isEmpty(entities)) {

        // make sure we replace the entities[] in the payload
        if (!_.isObject(msg.payload.entities) || _.isArray(msg.payload.entities)) {          
          msg.payload.entities = {};
        }
        if (!_.isObject(msg.payload.entities[language])) {
          msg.payload.entities[language] = {};
        }
        if (!_.isObject(msg.payload.entities[language][name])) {
          msg.payload.entities[language][name] = {};
        }
        // append entities
        msg.payload.entities[language][name] = [
          ...(_.isArray(msg.payload.entities[language][name]) ? msg.payload.entities[language][name] : []),
          ...entities
        ];
      }

      node.send(msg);
      done();
    });
  }

  registerType('chatbot-nlpjs-entity', ChatBotNLPEntity);
};
