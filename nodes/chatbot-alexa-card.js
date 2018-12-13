var qr = require('qr-image');
var MessageTemplate = require('../lib/message-template-async');
var utils = require('../lib/helpers/utils');
var append = utils.append;

module.exports = function(RED) {

  function ChatBotCard(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.cardType = config.cardType;
    this.cardType = config.cardType;
    this.text = config.text;
    this.title = config.title;
    this.content = config.content;
    this.smallImage = config.smallImage;
    this.largeImage = config.largeImage;

    this.on('input', function(msg) {

      var template = MessageTemplate(msg, node);
      var cardType = utils.extractValue('string', 'cardType', node, msg);
      var text = utils.extractValue('string', 'text', node, msg);
      var title = utils.extractValue('string', 'title', node, msg);
      var content = utils.extractValue('string', 'content', node, msg);
      var smallImage = utils.extractValue('string', 'smallImage', node, msg);
      var largeImage = utils.extractValue('string', 'largeImage', node, msg);

      var payload = null;
      switch(cardType) {
        case 'simple':
          payload = {
            type: 'card',
            cardType: 'simple',
            title: title,
            content: content
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
          console.log('tranlated', translated);
          append(msg, translated);
          node.send(msg);
        });
    });
  }
  RED.nodes.registerType('chatbot-alexa-card', ChatBotCard);

};
