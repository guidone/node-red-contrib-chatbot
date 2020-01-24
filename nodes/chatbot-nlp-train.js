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



const { NlpManager } = require('node-nlp');





module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotNLPjs(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    
    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };


      const name = extractValue('string', 'name', node, msg, false);

      const global = this.context().global;

      // check if valid message
      //if (!isValidMessage(msg, node)) {
       // return;
      //}
      //const chatId = getChatId(msg);
      //const messageId = getMessageId(msg);
      //const template = MessageTemplate(msg, node);
      //const transport = getTransport(msg);

      // DOCS
      // entities
      // https://github.com/axa-group/nlp.js/blob/master/docs/v3/slot-filling.md#entities-with-the-same-name

      // TODO collect all languages
      const manager = new NlpManager({ languages: ['en'] });
      const { payload } = msg;

      console.log('payload', payload)

      if (_.isObject(payload.intents)) {
        Object.keys(payload.intents).forEach(language => {
          Object.keys(payload.intents[language] || {}).forEach(intent => {
            (payload.intents[language][intent] || []).forEach(utterance => {
              console.log(`[${language.toUpperCase()}] - ${intent} : ${utterance}`);
              manager.addDocument(language, utterance, intent);
            });
          });
        });
      }



      // TODO collect language from payload
      


      /*manager.addNamedEntityText('room', 'kitchen', ['en'], ['kitchen']);
      manager.addNamedEntityText('room', 'dining room', ['en'], ['dining room']);
      manager.addNamedEntityText('room', 'bathroom', ['en'], ['bathroom', 'toilette', 'lavatory']);
      */


      await manager.train();
      manager.save();
      
      // TODO store somewhere the model
      
      global.set('nlp_' + (!_.isEmpty(name) ? name : 'default'), manager);

      //const response = await manager.process('en', msg.payload.content);
      //console.log(response);
      send(msg);
      done();
    });
  }

  registerType('chatbot-nlpjs-train', ChatBotNLPjs);
};
