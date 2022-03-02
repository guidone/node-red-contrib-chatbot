const MessageTemplate = require('../lib/message-template-async');
const utils = require('../lib/helpers/utils');
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

  const txType = {
    plainText: 'PlainText',
    ssml: 'SSML'
  };
  const txBehaviour = {
    enqueue: 'ENQUEUE',
    replaceAll: 'REPLACE_ALL',
    replaceEnqueued: 'REPLACE_ENQUEUED'
  };

  function ChatBotAlexaSpeech(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    globalContextHelper.init(this.context().global);
    this.speechType = config.speechType;
    this.text = config.text;
    this.ssml = config.ssml;
    this.playBehavior = config.playBehavior;
    this.reprompt = config.reprompt;

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
      if (!ChatExpress.isSupported(transport, 'speech')) {
        done(`Node "speech" is not supported by ${transport} transport`);
        return;
      }

      const speechType = utils.extractValue('string', 'speechType', node, msg, false);
      const text = extractValue('string', 'text', node, msg);
      const ssml = extractValue('string', 'ssml', node, msg);
      const playBehavior = extractValue('string', 'playBehavior', node, msg, false);
      const reprompt = extractValue('boolean', 'smallImage', node, msg, false);

      const payload = {
        chatId,
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
          // send out reply
          send(msg);
          done();
        });
    });
  }
  registerType('chatbot-alexa-speech', ChatBotAlexaSpeech);
};
