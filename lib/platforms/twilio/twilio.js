const _ = require('underscore');
const moment = require('moment');
const { ChatExpress, ChatLog } = require('chat-platform');
const twilio = require('twilio');

const utils = require('../../../lib/helpers/utils');
var helpers = require('./helpers');

const when = utils.when;
const fixNumber = helpers.fixNumber;

// set the messageId in a returning payload
const setMessageId = (message, messageId) => ({
  ...message,
  payload: {
    ...message.payload,
    messageId
  }
});

const Twilio = new ChatExpress({
  inboundMessageEvent: null,
  transport: 'twilio',
  transportDescription: 'Twilio',
  tsKey: function() {
    return moment();
  },
  messageIdKey: function(payload) {
    return payload.MessageSid;
  },
  chatIdKey: function(payload) {
    return payload.From;
  },
  userIdKey: function(payload) {
    return payload.From;
  },
  onStart: function() {
    var options = this.getOptions();
    options.connector = twilio(options.accountSid, options.authToken);
    return when(true);
  },
  onStop: function() {
    var options = this.getOptions();
    options.connector = null;
    return when(true);
  },
  routes: {
    '/redbot/twilio': function(req, res) {
      this.receive(req.body);
      res.send(''); // sending 200 cause an "OK" in whatsup
    }
  },
  routesDescription: {
    '/redbot/twilio': 'todo fix'
  }
});

Twilio.out('message', async function(message) {
  const options = this.getOptions();
  const context = message.chat();
  const client = message.client();
  const fromNumber = options.fromNumber;


  const response = await client.messages
    .create({
      body: message.payload.content,
      from: fixNumber(fromNumber),
      to: fixNumber(message.payload.chatId)
    });

  await when(context.set('messageId', response.sid));

  return setMessageId(message, response.sid);
});

/*
{ ToCountry: 'GB',
  ToState: '',
  SmsMessageSid: '',
  NumMedia: '0',
  ToCity: '',
  FromZip: '',
  SmsSid: '',
  FromState: '',
  SmsStatus: 'received',
  FromCity: '',
  Body: 'this is another answer',
  FromCountry: 'IT',
  To: '<twilio number>',
  MessagingServiceSid: '',
  ToZip: '',
  NumSegments: '1',
  MessageSid: '',
  AccountSid: '',
  From: '<who sent>',
  ApiVersion: '2010-04-01'
}
*/

// log messages, these should be the last
Twilio.out(function(message) {
  var options = this.getOptions();
  var logfile = options.logfile;
  var chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        var chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Twilio.in(function(message) {
  return new Promise(function (resolve) {
    if (!_.isEmpty(message.originalMessage.Body)) {
      message.payload.type = 'message';
      message.payload.content = message.originalMessage.Body;
    }
    resolve(message);
  });
});

Twilio.in('*', function(message) {
  var options = this.getOptions();
  var logfile = options.logfile;
  var chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        var chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Twilio.registerMessageType('message', 'Message', 'Send a plain text message');

module.exports = Twilio;
