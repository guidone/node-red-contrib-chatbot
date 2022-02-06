const utils = require('../lib/helpers/utils');
const MessageTemplate = require('../lib/message-template-async');
const emoji = require('node-emoji');
const _ = require('underscore');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotAsk(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.buttons = config.buttons;
    this.message = config.message;
    this.inline = config.inline;
    this.transports = ['telegram'];

    this.on('input', function(msg) {
      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var buttons = utils.extractValue('buttons', 'buttons', node, msg, true);
      var message = utils.extractValue('string', 'message', node, msg, false);

      // template then send
      template(message)
        .then(function(translated) {
          msg.payload = {
            type: _.isEmpty(buttons) ? 'reset-buttons': 'buttons',
            content: message != null ? emoji.emojify(translated) : null,
            chatId: chatId,
            messageId: messageId,
            buttons: buttons
          };
          node.send(msg);
        });
    });
  }

  registerType('chatbot-ask', ChatBotAsk);
};
