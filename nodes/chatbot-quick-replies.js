const MessageTemplate = require('../lib/message-template-async');
const emoji = require('node-emoji');
const RegisterType = require('../lib/node-installer');
const { ChatExpress } = require('chat-platform');
const { 
  isValidMessage, 
  getChatId, 
  getMessageId, 
  getTransport, 
  extractValue 
} = require('../lib/helpers/utils');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotQuickReplies(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.buttons = config.buttons;
    this.message = config.message;
    this.transports = ['facebook'];

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
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
      if (!ChatExpress.isSupported(transport, 'quick-replies')) {
        done(`Node "quick-replies" is not supported by ${transport} transport`);
        return;
      }
      // get values from config
      // prepare the message, first the config, then payload
      const buttons = extractValue('buttons', 'buttons', node, msg);
      const message = extractValue('string', 'message', node, msg);

      template(message, buttons)
        .then(([translatedMessage, translatedButtons]) => {        
          send({
            ...msg,
            payload: {
              type: 'quick-replies',
              content: message != null ? emoji.emojify(translatedMessage) : null,
              chatId: chatId,
              messageId: messageId,
              buttons: translatedButtons
            }
          });
          done();
        });
    });
  }

  registerType('chatbot-quick-replies', ChatBotQuickReplies);
};
