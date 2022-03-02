const _ = require('underscore');

const { ChatExpress } = require('chat-platform');
const RegisterType = require('../lib/node-installer');
const {
  isValidMessage,
  getChatId,
  getMessageId,
  getTransport,
  extractValue,
  appendPayload
} = require('../lib/helpers/utils');
const MessageTemplate = require('../lib/message-template-async');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotLocation(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
    this.latitude = config.latitude;
    this.longitude = config.longitude;
    this.place = config.place;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };
      const sendPayload = appendPayload(send, msg);
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

      let latitude = extractValue('float', 'latitude', node, msg, false);
      let longitude = extractValue('float', 'longitude', node, msg, false);
      const place = extractValue('string', 'place', node, msg, false);

      latitude = _.isNumber(latitude) ? latitude : parseFloat(latitude);
      longitude = _.isNumber(longitude) ? longitude : parseFloat(longitude);

      // payload
      sendPayload({
        type: 'location',
        content: {
          latitude: latitude,
          longitude: longitude
        },
        place: await template(place),
        chatId: chatId,
        messageId: messageId,
        inbound: false
      });
      done();
    });
  }

  registerType('chatbot-location', ChatBotLocation);
};
