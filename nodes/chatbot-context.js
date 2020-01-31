const utils = require('../lib/helpers/utils');
const _ = require('underscore');
const when = utils.when;
const RegisterType = require('../lib/node-installer');
const { isValidMessage } = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotContext(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.command = config.command;
    this.fieldValue = config.fieldValue;
    this.fieldType = config.fieldType;
    this.fieldName = config.fieldName;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };  
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      // get vars
      const fieldValue = node.fieldValue;
      const command = utils.extractValue('string', 'command', node, msg, false);
      const fieldType = utils.extractValue('string', 'fieldType', node, msg, false);
      const fieldName = utils.extractValue('string', 'fieldName', node, msg, false);
      const chatContext = msg.chat();
 
      let task = when(true);
      if (command === 'intent') {
        let variables;
        if (msg.payload != null && _.isObject(msg.payload.variables)) {
          variables = msg.payload.variables;
        } else if (msg.payload != null && _.isObject(msg.payload.content)) {
          variables = msg.payload.content;
        }
        task = task.then(() => chatContext.set(variables));
      } if (command === 'get') {
        when(chatContext.get(fieldName))
          .then(value => {
            msg.payload = value;
            send(msg);
            done();
          });
        return;
      } else if (command === 'delete') {
        task = when(chatContext.remove(fieldName));
      } else if (command === 'set') {
        switch (fieldType) {
          case 'str':
            task = when(chatContext.set(fieldName, fieldValue));
            break;
          case 'num':
            task = when(chatContext.set(fieldName, Number(fieldValue)));
            break;
          case 'bool':
            task = when(chatContext.set(fieldName, /^true$/i.test(fieldValue)));
            break;
          case 'json':
            try {
              task = when(chatContext.set(fieldName, JSON.parse(fieldValue)));
            } catch(e) {
              done('Unable to parse json in context node');
              return;
            }
            break;
        }
      }
      // finally
      task.then(() => {
        send(msg);
        done();
      });
    });
  }
  registerType('chatbot-context', ChatBotContext);

};
