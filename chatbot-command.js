var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotCommand(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.command = config.command;

    this.on('input', function(msg) {
      var command = node.command;
      var chatContext = msg.chat();

      var match = command;
      if (_.isEmpty(match)) {
        node.error('Command is empty.');
        return;
      }
      // add slash if missing
      if (match[0] != '/') {
        match = '/' + match;
      }
      // split command
      if (msg.payload != null && _.isString(msg.payload.content)) {
        var commands = msg.payload.content.split(' ');
        // check
        if (commands[0].replace(/(@.*?)$/, '') == match) {
          // store parameters in chat context
          if (commands.length > 1) {
            var idx = 0;
            for(idx = 1; idx < commands.length; idx++) {
              chatContext.set('param' + idx, commands[idx]);
            }
          }
          // pass through the command
          node.send(msg);
        }
      }
    });
  }
  RED.nodes.registerType('chatbot-command', ChatBotCommand);

};
