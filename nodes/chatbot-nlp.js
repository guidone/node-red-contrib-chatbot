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
    
    this.name = config.name;

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


      


      let language = await msg.chat().get('language');

      // TODO if not, try to guess
      console.log('Detecging', language)


      const response = await manager.process(language, msg.payload.content);
      console.log(response);

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
