const _ = require('underscore');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');

const { 
  isValidMessage, 
  getChatId, 
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
      //const template = MessageTemplate(msg, node);
      //const transport = getTransport(msg);



      node.send({
        ...msg,
        
        payload: {
          chatId, 
          type: 'poll'          
        }        
      });
      done();
    });
  }

  registerType('chatbot-poll', ChatBotPoll);
};
