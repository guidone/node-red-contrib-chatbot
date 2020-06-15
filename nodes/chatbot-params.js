const RegisterType = require('../lib/node-installer');
const { 
  isValidMessage,  
  getTransport, 
  extractValue 
} = require('../lib/helpers/utils');
const MessageTemplate = require('../lib/message-template-async');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotParams(config) {    
    RED.nodes.createNode(this, config);
    const node = this;
    this.params = config.params;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // check if valid message
      if (!isValidMessage(msg, node)) {
        done('Invalid input message');
        return;
      }      
      // get RedBot values
      const template = MessageTemplate(msg, node, { preserveNumbers: true });
      const transport = getTransport(msg);      
      // get vars
      let params = extractValue('params', 'params', node, msg)
      template(params.filter(param => param.platform === transport || param.platform === 'all'))
        .then(params => {        
          send({ 
            ...msg,
            payload: {
              ...msg.payload,
              params: params.reduce((accumulator, param) => ({ ...accumulator, [param.name]: param.value }), {})
            }            
          });
          done();
        });
    });
  }
  
  registerType('chatbot-params', ChatBotParams);
};