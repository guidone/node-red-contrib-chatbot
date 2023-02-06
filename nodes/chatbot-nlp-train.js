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
            const entity = payload.entities[language][name];
            if (entity.type === 'enum') {
              (entity.entities || []).forEach(item => {
                // prevent aliases containing a single empty string
                const aliases = (item.aliases || []).filter(str => !_.isEmpty(str));
                if (debug) {
                  // eslint-disable-next-line no-console
                  console.log(
                    '  Entity: ' + lcd.white(name) + ' [' + language.toUpperCase() + '] '
                    + lcd.green(item.name)
                    + (_.isArray(aliases) && !_.isEmpty(aliases) ? ` (${aliases.join(',')})` : '')
                  );
                }
                manager.addNamedEntityText(name, item.name, [language], !_.isEmpty(aliases) ? [item.name, ...aliases] : [item.name]);
              });
            } else if (entity.type === 'regex') {
              manager.nlp.addNerRegexRule(language, name, entity.regex);
              if (debug) {
                // eslint-disable-next-line no-console
                console.log(
                  '  Entity: ' + lcd.white(name) + ' [' + language.toUpperCase() + '] '
                  + lcd.green(entity.regex)
                );
              }
            }
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
