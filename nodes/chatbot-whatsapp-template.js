const RegisterType = require('../lib/node-installer');
const { ChatExpress } = require('chat-platform');
const {
  isValidMessage,
  getChatId,
  getMessageId,
  getTransport,
  extractValue,
  appendPayload
} = require('../lib/helpers/utils');
const MessageTemplate = require('../lib/message-template-async');

// Docs
// Supported language: https://developers.facebook.com/docs/whatsapp/api/messages/message-templates#supported-languages

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotWhatsappTemplate(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.paramsBody = config.paramsBody;
    this.paramsHeader = config.paramsHeader;
    this.template = config.template;
    this.language = config.language;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      const sendPayload = appendPayload(send, msg);
      // check if valid message
      if (!isValidMessage(msg, node)) {
        done('Invalid input message');
        return;
      }
      // get RedBot values
      const chatId = getChatId(msg);
      const messageId = getMessageId(msg);
      const template = MessageTemplate(msg, node);
      const transport = getTransport(msg);
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'whatsapp-template')) {
        done(`Node "chatbot-my-node" is not supported by ${transport} transport`);
        return;
      }

      // get vars
      let paramsBody = extractValue('whatsappTemplateParams', 'paramsBody', node, msg);
      let paramsHeader = extractValue('whatsappTemplateParams', 'paramsHeader', node, msg);
      let templateName = extractValue('string', 'template', node, msg);
      let language = extractValue('string', 'language', node, msg);

      template({ paramsBody, paramsHeader, templateName, language })
        .then(({ paramsBody, paramsHeader, templateName, language }) => {
          sendPayload({
            type: 'whatsapp-template',
            paramsBody,
            paramsHeader,
            template: templateName,
            language,
            chatId: chatId,
            messageId: messageId,
            inbound: false
          });
          done();
        });
    });
  }

  registerType('chatbot-whatsapp-template', ChatBotWhatsappTemplate);
};
