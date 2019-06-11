const MessageTemplate = require('../lib/message-template-async');
const utils = require('../lib/helpers/utils');
const append = utils.append;
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  var txType = {
    plainText: 'PlainText',
    ssml: 'SSML'
  };
  var txBehaviour = {
    enqueue: 'ENQUEUE',
    replaceAll: 'REPLACE_ALL',
    replaceEnqueued: 'REPLACE_ENQUEUED'
  };

  function ChatBotAlexaSpeech(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.speechType = config.speechType;
    this.text = config.text;
    this.ssml = config.ssml;
    this.playBehavior = config.playBehavior;
    this.reprompt = config.reprompt;

    this.on('input', function(msg) {

      var template = MessageTemplate(msg, node);
      var speechType = utils.extractValue('string', 'speechType', node, msg, false);
      var text = utils.extractValue('string', 'text', node, msg);
      var ssml = utils.extractValue('string', 'ssml', node, msg);
      var playBehavior = utils.extractValue('string', 'playBehavior', node, msg, false);
      var reprompt = utils.extractValue('boolean', 'smallImage', node, msg, false);

      var payload = {
        type: 'speech',
        speechType: txType[speechType],
        playBehavior: txBehaviour[playBehavior],
        reprompt: Boolean(reprompt)
      };
      if (speechType === 'plainText') {
        payload.text = text;
      } else if (speechType === 'ssml') {
        payload.ssml = ssml;
      }

      template(payload)
        .then(function(translated) {
          append(msg, translated);
          node.send(msg);
        });
    });
  }
  registerType('chatbot-alexa-speech', ChatBotAlexaSpeech);
};
