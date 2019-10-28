const utils = require('../lib/helpers/utils');
const when = utils.when;
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

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

  registerType('chatbot-authorized', ChatBotAuthorized);
};
