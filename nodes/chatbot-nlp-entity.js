const _ = require('underscore');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

const isValidRegex = str => {
  let isValid = true;
  try {
    new RegExp(str);
  } catch(e) {
    isValid = false;
  }
  return isValid;
};

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotNLPEntity(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);

    this.entities = config.entities;
    this.name = config.name;
    this.language = config.language;
    this.entityType = config.entityType;
    this.regex = config.regex;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const entities = utils.extractValue('arrayOfEntities', 'entities', node, msg);
      const name = utils.extractValue('string', 'name', node, msg, false);
      const language = utils.extractValue('string', 'language', node, msg, false);
      const entityType = utils.extractValue('string', 'entityType', node, msg, false);

      msg.payload = _.isObject(msg.payload) ? msg.payload : {};

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

      // collect the lexicon of the node and mix with the one of the incoming payload
      if (entityType === 'regex') {
        if (isValidRegex(node.regex)) {
          msg.payload.entities[language][name] = {
            type: 'regex',
            regex: node.regex
          };
        } else {
          done(`Invalid NLP.js regex for entity "${name}"`);
          return;
        }
      } else if (_.isEmpty(entityType) || entityType === 'enum') {
        if (_.isArray(entities) && !_.isEmpty(entities)) {
          msg.payload.entities[language][name] = {
            type: 'enum',
            entities: [
              ...(_.isArray(msg.payload.entities[language][name].entities) && msg.payload.entities[language][name].type === 'enum' ?
                msg.payload.entities[language][name].entities : []),
              ...entities
            ],
          };
        }
      } else {
        done(`Invalid NLP.js entity type: ${entityType} for entity "${name}"`);
        return;
      }

      send(msg);
      done();
    });
  }

  registerType('chatbot-nlpjs-entity', ChatBotNLPEntity);
};
