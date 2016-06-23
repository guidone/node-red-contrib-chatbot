module.exports = function(RED) {
  function TelegramSendMessage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.on('input', function(msg) {
      msg.payload.content = node.message;
      node.send(msg);
    });
  }
  RED.nodes.registerType('telegrambot-message', TelegramSendMessage);
};
