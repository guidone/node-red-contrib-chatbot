const _ = require('underscore');
const { Language } = require('node-nlp');

const RegisterType = require('../lib/node-installer');
const { isCommand } = require('../lib/helpers/regexps');
const { isValidMessage } = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotLanguage(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    
    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // check if valid message
      if (!isValidMessage(msg, node)) {
        done();
        return;
      }
      // exit if not string
      if (_.isString(msg.payload.content)) {
        // if it's a command, then don't care about the language
        if (isCommand(msg.payload.content)) {
          send(msg);
          done();
          return;
        }
        // now detect
        const languageGuesser = new Language();
        const guess = languageGuesser.guess(msg.payload.content);
        if (!_.isEmpty(guess)) {
          await msg.chat().set('language', guess[0].alpha2);
        }      
      }
      // go through
      node.send(msg);
      done();
    });
  }
  
  registerType('chatbot-language', ChatBotLanguage);
};
