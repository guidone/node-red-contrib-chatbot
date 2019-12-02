const _ = require('underscore');
const emoji = require('node-emoji');
const { ChatExpress } = require('chat-platform');
const RegisterType = require('../lib/node-installer');
const { 
  isValidMessage, 
  getChatId, 
  getMessageId, 
  getTransport, 
  extractValue,
  append 
} = require('../lib/helpers/utils');
const MessageTemplate = require('../lib/message-template-async');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotMessage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.parse_mode = config.parse_mode;

    this.pickOne = function(messages) {
      const luck = Math.floor(Math.random() * messages.length);
      return _.isString(messages[luck]) ? messages[luck] : messages[luck].message;
    };

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      // check if valid message
      if (!isValidMessage(msg, node)) {
        return;
      }
      const chatId = getChatId(msg);
      const messageId = getMessageId(msg);
      const template = MessageTemplate(msg, node);
      const transport = getTransport(msg);
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'message')) {
        done(`Node "message" is not supported by ${transport} transport`);
        return;
      }
      // try to get a plain string or number from config or payload or "message" variable
      // also try to get message from the "answer" key in payload, that to try to get the answer directly from nodes
      // like dialogflow/recast
      // also try to get an array of messages from config and pick one randomly
      const messages = extractValue(['string','messages', 'number'], 'message', node, msg)
        || extractValue('string', 'answer', node, msg, false);
      const fallback = extractValue('string', 'fallback', node, msg, false);
      const message = _.isArray(messages) ? node.pickOne(messages) : messages;

      template(message)
        .then(message => {
          // payload
          const payload = {
            type: 'message',
            content: emoji.emojify(message),
            chatId: chatId,
            messageId: messageId,
            inbound: false,
            fallback: fallback
          };
          // append
          append(msg, payload);
          // send out reply
          send(msg);
          done();
        });
    });
  }

  registerType('chatbot-message', ChatBotMessage);
};
