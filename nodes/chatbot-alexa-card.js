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

  function ChatBotCard(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.cardType = config.cardType;
    this.cardType = config.cardType;
    this.text = config.text;
    this.title = config.title;
    this.smallImage = config.smallImage;
    this.largeImage = config.largeImage;

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
      if (!ChatExpress.isSupported(transport, 'card')) {
        done(`Node "card" is not supported by ${transport} transport`);
        return;
      }

      const cardType = extractValue('string', 'cardType', node, msg, false);
      const text = extractValue('string', 'text', node, msg, false);
      const title = extractValue('string', 'title', node, msg, false);
      const smallImage = extractValue('string', 'smallImage', node, msg, false);
      const largeImage = extractValue('string', 'largeImage', node, msg, false);

      let payload = null;
      switch(cardType) {
        case 'simple':
          payload = {
            chatId,
            type: 'card',
            cardType: 'simple',
            title: title,
            content: text
          };
          break;
        case 'standard':
          payload = {
            chatId,
            type: 'card',
            cardType: 'standard',
            title: title,
            text: text,
            smallImage: smallImage,
            largeImage: largeImage
          };
          break;
        case 'linkAccount':
          break;
        case 'askForPermissionsConsent':
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

  registerType('chatbot-alexa-card', ChatBotCard);
};
