var _ = require('underscore');
var MessageTemplate = require('../lib/message-template.js');
var request = require('request').defaults({ encoding: null });
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotVoice(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.language = config.language;
    this.transports = ['telegram', 'facebook'];

    this.on('input', function(msg) {
      var message = node.message;
      var language = node.language;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      if (!_.isEmpty(node.message)) {
        message = node.message;
      } else if (_.isString(msg.payload) && !_.isEmpty(msg.payload)) {
        message = msg.payload;
      } else {
        node.error('Empty message');
      }

      var parsedMessage = template(message);
      var voiceUrl = 'http://www.voicerss.org/controls/speech.ashx?'
        + 'hl=' + language
        + '&src=' + encodeURI(parsedMessage) + '&c=mp3'
        + '&rnd=' + Math.random();

      request.get({
        url: voiceUrl,
        headers: {}
      }, function(err, response, buffer) {
        if (err) {
          node.error('Error contacting VoiceRSS');
        } else {
          msg.payload = {
            type: 'audio',
            content: buffer,
            filename: 'audio.mp3',
            chatId: chatId,
            messageId: messageId,
            inbound: false
          };
          node.send(msg);
        }
      });

    });
  }

  RED.nodes.registerType('chatbot-voice', ChatBotVoice);
};
