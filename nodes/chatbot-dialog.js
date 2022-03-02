const utils = require('../lib/helpers/utils');
const _ = require('underscore');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotDialog(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.name = config.name;
    this.elements = _.isArray(config.elements) && !_.isEmpty(config.elements) ? config.elements : null;
    this.title = config.title;
    this.submitLabel = config.submitLabel;
    this.transports = ['slack'];

    this.on('input', function(msg) {

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var title = utils.extractValue('string', 'title', node, msg, false);
      var submitLabel = utils.extractValue('string', 'submitLabel', node, msg, false);
      var elements = utils.extractValue('arrayOfObject', 'elements', node, msg, true);

      // payload
      msg.payload = {
        type: 'dialog',
        title: title,
        submitLabel: submitLabel,
        elements: elements,
        chatId: chatId,
        messageId: messageId
      };
      node.send(msg);
    });
  }

  registerType('chatbot-dialog', ChatBotDialog);
};
