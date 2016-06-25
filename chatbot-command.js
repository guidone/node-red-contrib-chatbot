var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotCommand(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.command = config.command;

    this.on('input', function(msg) {
      var command = node.command;

      var match = command;
      if (_.isEmpty(match)) {
        node.error('Command is empty.');
        return;
      }
      // add slash if missing
      if (match[0] != '/') {
        match = '/' + match;
      }
      // check
      if (msg.payload != null && msg.payload.content == match) {
        node.send(msg);
      }
    });
  }
  RED.nodes.registerType('chatbot-command', ChatBotCommand);

};
