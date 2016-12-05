var _ = require('underscore');

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

      var context = node.context();
      var command = this.command;
      var fieldValue = this.fieldValue;
      var fieldType = this.fieldType;
      var fieldName = this.fieldName;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);

      var chatContext = msg.chat();
      if (chatContext == null) {
        node.error('Unable to find a chat context for chatId: ' + chatId);
        return;
      }
      if (_.isEmpty(fieldName)) {
        node.error('Invalid variable name');
        return;
      }

      switch(command) {

        case 'get':
          msg.payload = chatContext.get(fieldName);
          node.send(msg);
          break;

        case 'delete':
          chatContext.remove(fieldName);
          node.send(msg);
          break;

        case 'set':

          switch (fieldType) {
            case 'str':
              chatContext.set(fieldName, fieldValue);
              break;
            case 'num':
              chatContext.set(fieldName, Number(fieldValue));
              break;
            case 'bol':
              chatContext.set(fieldName, /^true$/i.test(fieldValue));
              break;
            case 'json':
              try {
                chatContext.set(fieldName, JSON.parse(fieldValue));
              } catch(e) {
                node.error('Unable to parse json in context node');
              }
              break;
          }
          node.send(msg);
          break;
      }

    });
  }
  RED.nodes.registerType('chatbot-context', ChatBotContext);

};
