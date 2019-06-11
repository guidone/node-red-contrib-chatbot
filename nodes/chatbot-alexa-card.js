const MessageTemplate = require('../lib/message-template-async');
const utils = require('../lib/helpers/utils');
const append = utils.append;
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotCard(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.cardType = config.cardType;
    this.cardType = config.cardType;
    this.text = config.text;
    this.title = config.title;
    this.smallImage = config.smallImage;
    this.largeImage = config.largeImage;

    this.on('input', function(msg) {

      var template = MessageTemplate(msg, node);
      var cardType = utils.extractValue('string', 'cardType', node, msg, false);
      var text = utils.extractValue('string', 'text', node, msg, false);
      var title = utils.extractValue('string', 'title', node, msg, false);
      var smallImage = utils.extractValue('string', 'smallImage', node, msg, false);
      var largeImage = utils.extractValue('string', 'largeImage', node, msg, false);

      var payload = null;
      switch(cardType) {
        case 'simple':
          payload = {
            type: 'card',
            cardType: 'simple',
            title: title,
            content: text
          };
          break;
        case 'standard':
          payload = {
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
        .then(function(translated) {
          append(msg, translated);
          node.send(msg);
        });
    });
  }
  registerType('chatbot-alexa-card', ChatBotCard);

};
