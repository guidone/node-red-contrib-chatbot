var MessageTemplate = require('../lib/message-template-async');
var utils = require('../lib/helpers/utils');
var append = utils.append;

module.exports = function(RED) {

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
  RED.nodes.registerType('chatbot-alexa-speech', ChatBotAlexaSpeech);

};
