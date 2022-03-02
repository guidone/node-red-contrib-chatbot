const request = require('request').defaults({ encoding: null });
const RegisterType = require('../lib/node-installer');
const { ChatExpress } = require('chat-platform');
const { 
  isValidMessage, 
  getChatId, 
  getMessageId, 
  getTransport, 
  extractValue 
} = require('../lib/helpers/utils');
const MessageTemplate = require('../lib/message-template-async');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotVoice(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.message = config.message;
    this.language = config.language;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // check if valid message
      if (!isValidMessage(msg, node)) {
        done();
        return;
      }      
      // get RedBot values
      const chatId = getChatId(msg);
      const messageId = getMessageId(msg);
      const template = MessageTemplate(msg, node);
      const transport = getTransport(msg);   
      // check platform
      if (!ChatExpress.isSupported(transport, 'audio')) {
        done(`Node "voice" is not supported by ${transport} transport`);
        return;
      }
      // get vars
      let message = extractValue('string', 'message', node, msg)
      let language = extractValue('string', 'language', node, msg)

      template(message)
        .then(parsedMessage => {
          const voiceUrl = 'http://www.voicerss.org/controls/speech.ashx?'
            + `hl=${language}&src=${encodeURI(parsedMessage)}&c=mp3&rnd=${Math.random()}`;
          request.get({
            url: voiceUrl,
            headers: {
              Referer: 'http://www.voicerss.org/api/demo.aspx'
            }
          }, (err, response, buffer) => {            
            if (err) {
              done('Error contacting VoiceRSS');
            } else {
              send({
                ...msg,
                payload: {
                  type: 'audio',
                  content: buffer,
                  filename: 'audio.mp3',
                  chatId: chatId,
                  messageId: messageId,
                  inbound: false
                }
              });
              done();
            }
          });
        });
    });
  }

  registerType('chatbot-voice', ChatBotVoice);
};
