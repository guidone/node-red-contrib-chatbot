var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var when = utils.when;

module.exports = function(RED) {

  function ChatBotContext(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.command = config.command;
    this.fieldValue = config.fieldValue;
    this.fieldType = config.fieldType;
    this.fieldName = config.fieldName;

    this.on('input', function(msg) {

      msg = RED.util.cloneMessage(msg);

      var fieldValue = node.fieldValue;
      var command = utils.extractValue('string', 'command', node, msg, false);
      var fieldType = utils.extractValue('string', 'fieldType', node, msg, false);
      var fieldName = utils.extractValue('string', 'fieldName', node, msg, false);

      var chatContext = msg.chat();
      if (chatContext == null) {
        lcd.title('Error: invalid chat context  (id:' + node.id + ')');
        // eslint-disable-next-line no-console
        console.log(lcd.warn(
          'A chat context was not found fot this message, perhaps the flow needs a \'Conversation node\''
        ));
        node.error('invalid chat context: A chat context was not found fot this message, perhaps the flow needs a \'Conversation node\'');
        return;
      }
      /*if (_.isEmpty(fieldName)) {
        node.error('Invalid variable name');
        return;
      }*/

      var task = when(true);
      if (command === 'intent') {
        task = task.then(function() {
          return chatContext.set(msg.payload.variables);
        });
      } if (command === 'get') {
        when(chatContext.get(fieldName))
          .then(function(value) {
            msg.payload = value;
            node.send(msg);
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
          case 'bol':
            task = when(chatContext.set(fieldName, /^true$/i.test(fieldValue)));
            break;
          case 'json':
            try {
              task = when(chatContext.set(fieldName, JSON.parse(fieldValue)));
            } catch(e) {
              node.error('Unable to parse json in context node');
            }
            break;
        }
      }
      // finally
      task
        .then(function() {
          node.send(msg);
        });
    });
  }
  RED.nodes.registerType('chatbot-context', ChatBotContext);

};
