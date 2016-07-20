module.exports = function(RED) {

  function ChatBotCommand(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      // do nothing
      if (originalMessage == null) {
        return;
      }

      switch(originalMessage.transport) {
        case 'telegram':
          node.send([msg, null, null]);
          break;
        case 'facebook':
          node.send([null, msg, null]);
          break;
        case 'slack':
          node.send([null, null, msg]);
          break;
      }
    });
  }

  RED.nodes.registerType('chatbot-transport', ChatBotCommand);
};
