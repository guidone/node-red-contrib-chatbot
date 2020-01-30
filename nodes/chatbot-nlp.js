const _ = require('underscore');

const { ChatExpress } = require('chat-platform');
const RegisterType = require('../lib/node-installer');
const { 
  isValidMessage, 
  getChatId, 
  getMessageId, 
  getTransport, 
  extractValue,
  append 
} = require('../lib/helpers/utils');



//const { NlpManager } = require('node-nlp');





module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotNLPjs(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      const chatId = getChatId(msg);
      const messageId = getMessageId(msg);
      //const template = MessageTemplate(msg, node);
      const transport = getTransport(msg);

      const global = this.context().global;

      const name = extractValue('string', 'name', node, msg, false);

      // DOCS
      // entities
      // https://github.com/axa-group/nlp.js/blob/master/docs/v3/slot-filling.md#entities-with-the-same-name

      const manager = global.get('nlp_' + (!_.isEmpty(name) ? name : 'default'));


      

      /*manager.addDocument('en', 'switch on light', 'switch.on.light');
      manager.addDocument('en', 'switch on the light', 'switch.on.light');
      manager.addDocument('en', 'turn on the light', 'switch.on.light');
      manager.addDocument('en', 'turn on light', 'switch.on.light');
      manager.addDocument('en', 'turn on light in the %room%', 'switch.on.light');
      manager.addDocument('en', 'turn on the light in %room%', 'switch.on.light');
      
      manager.addDocument('en', 'turn on the light number %number%', 'switch.on.light.bynumber');

      manager.addDocument('en', 'turn on all the lights', 'switch.on.lights');
      manager.addDocument('en', 'turn on the lights', 'switch.on.lights');

      manager.addNamedEntityText('room', 'kitchen', ['en'], ['kitchen']);
      manager.addNamedEntityText('room', 'dining room', ['en'], ['dining room']);
      manager.addNamedEntityText('room', 'bathroom', ['en'], ['bathroom', 'toilette', 'lavatory']);*/



      const response = await manager.process('en', msg.payload.content);
      console.log(response);
      
      send({
        ...msg,
        payload: {
          type: 'intent',
          //isFallback: isFallback,
          intent: response.intent,
          //variables: !_.isEmpty(variables) ? variables : null,
          //answer: answer
        }
      });
      

      // TODO prepare resposne same as other nodes
      
      done();



    });
  }

  registerType('chatbot-nlpjs', ChatBotNLPjs);
};
