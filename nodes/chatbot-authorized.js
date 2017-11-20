var utils = require('../lib/helpers/utils');
var when = utils.when;

module.exports = function(RED) {

  function ChatBotAuthorized(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {
      var chatContext = msg.chat();
      when(chatContext.get('authorized'))
        .then(function(authorized) {
          // check
          if (authorized === true) {
            node.send([msg, null]);
          } else {
            node.send([null, msg]);
          }
        });

    });
  }

  RED.nodes.registerType('chatbot-authorized', ChatBotAuthorized);
};
