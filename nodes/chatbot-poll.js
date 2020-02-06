const _ = require('underscore');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');

const { 
  isValidMessage, 
  getChatId, 
  MessageTemplate,
  getMessageId, 
  getTransport, 
  extractValue,
  append 
} = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotPoll(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.utterances = config.utterances;
    this.intent = config.intent;
    this.language = config.language;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const chatId = getChatId(msg);
      //const messageId = getMessageId(msg);
      const template = MessageTemplate(msg, node);
      //const transport = getTransport(msg);


      const options = [
        'Uno',
        'Due',
        'Tre'
      ];

      const pollType = 'regular';
      const isAnonymous = false;
      const allowMultipleAnswers = false;
      const correctOptionId = null;  
      const question = 'This is a poll';


      template({ question, options })
        .then(({ question, options }) => {
          node.send({
            ...msg,        
            payload: {
              chatId, 
              question,
              type: 'poll',
              options,
              isAnonymous, 
              pollType, 
              allowMultipleAnswers, 
              correctOptionId          
            }        
          });  
          done();
        });
    });
  }

  registerType('chatbot-poll', ChatBotPoll);
};
