const _ = require('underscore');
const { Language } = require('node-nlp');

const RegisterType = require('../lib/node-installer');
const { isValidMessage, extractValue } = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotNLPjs(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    
    this.name = config.name;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }

      const global = this.context().global;
      const name = extractValue('string', 'name', node, msg, false);
      const content = msg.payload != null ? msg.payload.content : null;

      // DOCS
      // entities
      // https://github.com/axa-group/nlp.js/blob/master/docs/v3/slot-filling.md#entities-with-the-same-name

      // get the right nlp model
      const manager = global.get('nlp_' + (!_.isEmpty(name) ? name : 'default'));
      
      // check if string
      if (!_.isString(content)) {
        done('Incoming message is not a string');
        return;
      }
      let language = await msg.chat().get('language');
      if (_.isEmpty(language)) {
        const languageGuesser = new Language();
        const guess = languageGuesser.guess(content);
        if (!_.isEmpty(guess)) {
          language = guess[0].alpha2;
        }
      }
      // skip if language is not detected
      if (_.isEmpty(language)) {
        done('Unable to detect content language, skipping');
        return;
      }
      // finally process
      const response = await manager.process(language, content);
      // extract vars
      const variables = {};
      (response.entities || []).forEach(entity => variables[entity.entity] = entity.option);

      send({
        ...msg,
        payload: {
          type: 'intent',
          isFallback: response.intent === 'None',
          language: response.localeIso2,
          intent: response.intent,
          variables: !_.isEmpty(variables) ? variables : null
        }
      });
      done();
    });
  }

  registerType('chatbot-nlpjs', ChatBotNLPjs);
};
