const _ = require('underscore');
const fetch = require('node-fetch').default;

const RegisterType = require('../lib/node-installer');
const {
  isValidMessage,
  getChatId,
  getUserId,
  getTransport,
  extractValue
} = require('../lib/helpers/utils');
const MessageTemplate = require('../lib/message-template-async');

/*
Limitations
Requests can have a maximum of 25 events.
Events can have a maximum of 25 parameters.
Events can have a maximum of 25 user properties.
User property names must be 24 characters or fewer.
User property values must be 36 characters or fewer.
Event names must be 40 characters or fewer, may only contain alpha-numeric characters and underscores, and must start with an alphabetic character.
Parameter names (including item parameters) must be 40 characters or fewer, may only contain alpha-numeric characters and underscores, and must start with an alphabetic character.
Parameter values (including item parameter values) must be 100 character or fewer.
Item parameters can have a maximum of 10 custom parameters.
The post body must be smaller than 130kB.

*/

const sanitizeParamValue = value => {
  return String(value).substr(0, 100);
};

const sanitizeEventName = value => {
  return value.replace(/[^a-z0-9_]/gi, '').substr(0, 40);
};

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotGoogleAnalytics(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.measurementId = config.measurementId;
    this.secretApi = config.secretApi;
    this.eventName = config.eventName;
    this.eventValue = config.eventValue;

    this.on('input', async function(msg, send, done) {
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
      const userId = getUserId(msg);
      const template = MessageTemplate(msg, node);
      const transport = getTransport(msg);

      // get vars
      let measurementId = extractValue('string', 'measurementId', node, msg);
      let secretApi = extractValue('string', 'secretApi', node, msg);
      let eventName = extractValue('string', 'eventName', node, msg);
      let eventValue = extractValue(['string', 'object'], 'eventValue', node, msg);

      // defaults to some event
      if (_.isEmpty(eventName) && msg.sentMessage != null) {
        eventName = 'OutboundMessage';
      } else if (_.isEmpty(eventName) && msg.originalMessage != null) {
        eventName = 'InboundMessage';
      }

      // prepare payload
      const eventParsed = await template(eventName);
      const url = `https://www.google-analytics.com/mp/collect?api_secret=${secretApi}&measurement_id=${measurementId}`;
      const params = {
        session_id: chatId,
        transport: sanitizeParamValue(transport)
      };
      if (_.isString(eventValue) && !_.isEmpty(eventValue)) {
        params.value = sanitizeParamValue(await template(eventValue));
      }
      const gaPayload = {
        client_id: msg.originalMessage.chatbotId,
        user_id: userId,
        timestamp_micros: String((new Date()).getTime() * 1000),
        non_personalized_ads: false,
        events: [
            {
              name: sanitizeEventName(eventParsed),
              params
            }
          ]
      };

      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(gaPayload)
      });

      if (res.status >= 300) {
        // eslint-disable-next-line no-console
        console.log(`Error sending event ${eventParsed} to Google Analytics`);
      }
      done();
    });
  }

  registerType('chatbot-google-analytics', ChatBotGoogleAnalytics);
};