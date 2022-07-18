const _ = require('underscore');
const { Language } = require('node-nlp');

const prettyjson = require('prettyjson');
const lcd = require('../lib/helpers/lcd');
const RegisterType = require('../lib/node-installer');
const MessageTemplate = require('../lib/message-template-async');
const { variable: isVariable } = require('../lib/helpers/validators');
const { isValidMessage, extractValue, isCommand } = require('../lib/helpers/utils');
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
    this.scoreThreshold = config.scoreThreshold;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      // if it's a command, don't parse it, skip
      if (isCommand(msg)) {
        send({
          ...msg,
          previous: { ...msg.payload }, // store previous msg, use POP to retrieve
        });
        done();
        return;
      }

      const template = MessageTemplate(msg, node);
      const name = extractValue('string', 'name', node, msg, false);
      const debug = extractValue('boolean', 'debug', node, msg, false);
      let scoreThreshold = extractValue(['number', 'string', 'variable'], 'scoreThreshold', node, msg, false);
      const content = msg.payload != null ? msg.payload.content : null;

      // if not number, then evaluate it
      if (isVariable(scoreThreshold)) {
        scoreThreshold = await template.evaluate(scoreThreshold);
      } else if (_.isString(scoreThreshold)) {
        scoreThreshold = parseInt(scoreThreshold, 10);
      }
      if (isNaN(scoreThreshold) || scoreThreshold <= 0 || scoreThreshold > 100) {
        // eslint-disable-next-line no-console
        console.log(lcd.node({ scoreThreshold }, { title: 'Invalid scoreThreshold value, must be > 0 and <= 100', nodeId: node.id }));
        scoreThreshold = 50;
      }
      scoreThreshold = scoreThreshold / 100;

      // DOCS
      // entities
      // https://github.com/axa-group/nlp.js/blob/master/docs/v3/slot-filling.md#entities-with-the-same-name

      // get the right nlp model
      const manager = globalContextHelper.get('nlp_' + (!_.isEmpty(name) ? name : 'default'));

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
          if (debug) {
            // eslint-disable-next-line no-console
            console.log(lcd.white('[NLP] gueesed language ') +  lcd.green(language));
          }
        }
      } else {
        if (debug) {
          // eslint-disable-next-line no-console
          console.log(lcd.white('[NLP] detecting with user language ') +  lcd.green(language));
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
      (response.entities || []).forEach(entity => {
        const name = entity.alias != null ? entity.alias : entity.entity;
        const obj = entity.option ? entity.option : entity.resolution;
        obj.entity = entity.entity;
        // ensure all extracted entity has at least "value" and "entity" keeping all
        // other keys for retrocompatibility
        if (obj.value == null) {
          if (obj.values != null && Array.isArray(obj.values) && obj.values.length !== 0) {
            obj.value = obj.values[0].value;
            // handle the exception of duration as string
            if (obj.entity === 'duration') {
              obj.value = parseInt(obj.value, 10);
            }
          }
        }
        variables[name] = obj;
      });

      if (debug) {
        // eslint-disable-next-line no-console
        console.log(lcd.white('[NLP] ') + lcd.grey('Processing model ') + lcd.green(name));
        // eslint-disable-next-line no-console
        console.log('  Input: ' + lcd.green(`"${content}"`) + lcd.white(` (${language})`));
        // eslint-disable-next-line no-console
        console.log(lcd.white('  Score threshold: ') + lcd.green(scoreThreshold * 100) + lcd.grey(' %'));
        // eslint-disable-next-line no-console
        console.log(lcd.white('  Language guessed: ') + lcd.green(response.languageGuessed));
        // eslint-disable-next-line no-console
        console.log(lcd.white('  Intent: ') + lcd.green(response.intent));
        // eslint-disable-next-line no-console
        console.log(lcd.white('  Domain: ') + lcd.green(response.domain));
        // eslint-disable-next-line no-console
        console.log(lcd.white('  Score: ') + lcd.green((response.score * 100).toFixed(1)) + lcd.grey(' %'));
        // eslint-disable-next-line no-console
        console.log(
          lcd.white('  Sentiment: ')
          + lcd.green(response.sentiment.vote)
          + ' score ' + lcd.green((response.sentiment.score * 100).toFixed(1)) + lcd.grey(' %')
        );
        if (!_.isEmpty(variables)) {
          // eslint-disable-next-line no-console
          console.log(lcd.white('  Variables: '));
          // eslint-disable-next-line no-console
          console.log(prettyjson.render(variables))
        }
      }
      // if above the score
      let intent = 'None';
      if (response.score > scoreThreshold) {
        intent = response.intent;
      }

      send({
        ...msg,
        previous: msg.payload, // store previous msg, use POP to retrieve
        payload: {
          type: 'intent',
          score: response.score,
          isFallback: intent === 'None',
          language: response.localeIso2,
          intent,
          variables: !_.isEmpty(variables) ? variables : null
        }
      });
      done();
    });
  }

  registerType('chatbot-nlpjs', ChatBotNLPjs);
};
