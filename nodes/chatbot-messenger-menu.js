const utils = require('../lib/helpers/utils');
const _ = require('underscore');
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotMessengerMenu(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.items = config.items;
    this.command = config.command;
    this.composerInputDisabled = config.composerInputDisabled;
    this.transports = ['facebook'];

    this.on('input', function(msg) {

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var items = utils.extractValue('buttons', 'items', node, msg);
      var command = utils.extractValue('string', 'command', node, msg);
      var composerInputDisabled = utils.extractValue('boolean', 'composerInputDisabled', node, msg);

      // payload
      msg.payload = {
        type: 'persistent-menu',
        chatId: chatId,
        messageId: messageId,
        items: items,
        command: !_.isEmpty(command) ? command : 'set',
        composerInputDisabled: _.isBoolean(composerInputDisabled) ? composerInputDisabled : false
      };

      node.send(msg);
    });

  }

  registerType('chatbot-messenger-menu', ChatBotMessengerMenu);
};
