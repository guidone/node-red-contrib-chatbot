const _ = require('underscore');
const { NlpManager } = require('node-nlp');

const RegisterType = require('../lib/node-installer');
const { extractValue } = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotNLPjs(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    
    this.name = config.name;
    this.debug = config.debug;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const name = extractValue('string', 'name', node, msg, false);
      const debug = extractValue('boolean', 'debug', node, msg, false);

      const global = this.context().global;

      // DOCS
      // entities
      // https://github.com/axa-group/nlp.js/blob/master/docs/v3/slot-filling.md#entities-with-the-same-name

      const { payload } = msg;

      // collect all languages from payload
      const languages = _.uniq([...Object.keys(payload.intents || {}), ...Object.keys(payload.entities || {})]);
    
      const manager = new NlpManager({ 
        languages, 
        nlu: { log: debug || false },
        autoSave: false,
        autoLoad: false 
      });

      // adding intents
      if (_.isObject(payload.intents)) {
        Object.keys(payload.intents).forEach(language => {
          Object.keys(payload.intents[language] || {}).forEach(intent => {
            (payload.intents[language][intent] || []).forEach(utterance => {
              if (debug) {
                // eslint-disable-next-line no-console
                console.log(`Intent: ${intent} [${language.toUpperCase()}] : ${utterance}`);
              }
              manager.addDocument(language, utterance, intent);
            });
          });
        });
      }

      // adding entities
      if (_.isObject(payload.entities)) {
        Object.keys(payload.entities).forEach(language => {
          Object.keys(payload.entities[language] || {}).forEach(name => {
            (payload.entities[language][name] || []).forEach(entity => {
              if (debug) {
                // eslint-disable-next-line no-console
                console.log(`Entity ${name} [${language.toUpperCase()}] : ${entity.name} (${entity.aliases.join(',')})`);
              }              
              manager.addNamedEntityText(name, entity.name, [language], _.isEmpty(entity.aliases) ? entity.aliases : null);
            });
          });
        });
      }

      await manager.train();
      manager.save();
      // store globally          
      global.set('nlp_' + (!_.isEmpty(name) ? name : 'default'), manager);

      send({...msg, payload: manager });
      done();
    });
  }

  registerType('chatbot-nlpjs-train', ChatBotNLPjs);
};
