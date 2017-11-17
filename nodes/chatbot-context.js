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

      var command = this.command;
      var fieldValue = this.fieldValue;
      var fieldType = this.fieldType;
      var fieldName = this.fieldName;
      var chatId = utils.getChatId(msg);

      var chatContext = msg.chat();
      if (chatContext == null) {
        node.error('Unable to find a chat context for chatId: ' + chatId);
        return;
      }
      if (_.isEmpty(fieldName)) {
        node.error('Invalid variable name');
        return;
      }

      var task = when(true);
      if (command === 'get') {
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
      task.then(function() {
          node.send(msg);
        });
    });
  }
  RED.nodes.registerType('chatbot-context', ChatBotContext);

};
