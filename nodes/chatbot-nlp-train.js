const _ = require('underscore');
const { NlpManager } = require('node-nlp');

const lcd = require('../lib/helpers/lcd');
const RegisterType = require('../lib/node-installer');
const { extractValue } = require('../lib/helpers/utils');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotNLPjs(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    globalContextHelper.init(this.context().global);

    this.name = config.name;
    this.debug = config.debug;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const name = extractValue('string', 'name', node, msg, false);
      const debug = extractValue('boolean', 'debug', node, msg, false);

      // DOCS
      // entities
      // https://github.com/axa-group/nlp.js/blob/master/docs/v3/slot-filling.md#entities-with-the-same-name

      const { payload } = msg;

      // collect all languages from payload
      const languages = _.uniq([...Object.keys(payload.intents || {}), ...Object.keys(payload.entities || {})]);

      const manager = new NlpManager({
        languages,
        nlu: { log: false },
        autoSave: false,
        autoLoad: false,
        forceNER: true
      });

      if (debug) {
        // eslint-disable-next-line no-console
        console.log(lcd.white('[NLP] ') + lcd.grey('Training model ') + lcd.green(name));
      }

      // adding intents
      if (_.isObject(payload.intents)) {
        Object.keys(payload.intents).forEach(language => {
          Object.keys(payload.intents[language] || {}).forEach(intent => {
            (payload.intents[language][intent] || []).forEach(utterance => {
              if (debug) {
                // eslint-disable-next-line no-console
                console.log('  Intent: ' + lcd.white(intent) + ' [' + language.toUpperCase() + '] ' + lcd.green(utterance));
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
                console.log(
                  '  Entity: ' + lcd.white(name) + ' [' + language.toUpperCase() + '] '
                  + lcd.green(entity.name)
                  + _.isArray(entity.aliases) && !_.isEmpty(entity.aliases) ? ` (${entity.aliases.join(',')})` : ''
                );
              }
              manager.addNamedEntityText(name, entity.name, [language], !_.isEmpty(entity.aliases) ? [entity.name, ...entity.aliases] : [entity.name]);
            });
          });
        });
      }

      await manager.train();
      manager.save();
      // store globally
      globalContextHelper.set('nlp_' + (!_.isEmpty(name) ? name : 'default'), manager);

      send({...msg, payload: manager });
      done();
    });
  }

  registerType('chatbot-nlpjs-train', ChatBotNLPjs);
};
