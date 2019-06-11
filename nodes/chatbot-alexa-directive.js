const MessageTemplate = require('../lib/message-template-async');
const utils = require('../lib/helpers/utils');
const append = utils.append;
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotAlexaDirective(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.directiveType = config.directiveType;
    this.slot = config.slot;

    this.on('input', function(msg) {

      var template = MessageTemplate(msg, node);
      var directiveType = utils.extractValue('string', 'directiveType', node, msg, false);
      var slot = utils.extractValue('string', 'slot', node, msg, false);
      var payload = {
        type: 'directive',
        directiveType: directiveType
      };
      switch(directiveType) {
        case 'Dialog.ConfirmSlot':
          payload.slotToConfirm = slot;
          break;
        case 'Dialog.ElicitSlot':
          payload.slotToElicit = slot;
          break;
      }

      template(payload)
        .then(function(translated) {
          append(msg, translated);
          node.send(msg);
        });
    });
  }
  registerType('chatbot-alexa-directive', ChatBotAlexaDirective);

};
