var qr = require('qr-image');
var MessageTemplate = require('../lib/message-template-async');
var utils = require('../lib/helpers/utils');
var append = utils.append;

module.exports = function(RED) {

  function ChatBotDirective(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.directiveType = config.directiveType;
    this.slot = config.slot;

    this.on('input', function(msg) {

      var template = MessageTemplate(msg, node);
      var directiveType = utils.extractValue('string', 'directiveType', node, msg);
      var slot = utils.extractValue('string', 'slot', node, msg);
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
  RED.nodes.registerType('chatbot-directive', ChatBotDirective);

};
