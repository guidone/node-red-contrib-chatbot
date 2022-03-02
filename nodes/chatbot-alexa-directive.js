const MessageTemplate = require('../lib/message-template-async');
const RegisterType = require('../lib/node-installer');
const { ChatExpress } = require('chat-platform'); 
const { 
  isValidMessage, 
  getChatId, 
  getTransport, 
  extractValue,
  append 
} = require('../lib/helpers/utils');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotAlexaDirective(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    globalContextHelper.init(this.context().global);
    this.directiveType = config.directiveType;
    this.slot = config.slot;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      const chatId = getChatId(msg);
      const template = MessageTemplate(msg, node);
      const transport = getTransport(msg);

      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'directive')) {
        done(`Node "directive" is not supported by ${transport} transport`);
        return;
      }

      const directiveType = extractValue('string', 'directiveType', node, msg, false);
      const slot = extractValue('string', 'slot', node, msg, false);
      const payload = {
        chatId,
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
        .then(translated => {
          append(msg, translated);
          send(msg);
          done();
        });
    });
  }
  registerType('chatbot-alexa-directive', ChatBotAlexaDirective);

};
