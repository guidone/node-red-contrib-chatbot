var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var ChatLog = require('../chat-log');
var utils = require('../../lib/helpers/utils');
var when = utils.when;

var twilio = require('twilio');

var Twilio = new ChatExpress({
  inboundMessageEvent: null,
  transport: 'twilio',
  tsKey: function() {
    return moment();
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
      res.send(200);
    }
  },
  routesDescription: {
    '/redbot/twilio': 'todo fix'
  }
});

Twilio.out('message', function(message) {
  var options = this.getOptions();
  var context = message.chat();
  var client = message.client();
  var fromNumber = options.fromNumber;
  // get from number
  if (_.isString(fromNumber) && !_.isEmpty(fromNumber) && fromNumber[0] !== '+') {
    fromNumber = '+' + fromNumber;
  }
  return new Promise(function (resolve, reject) {
    client.messages
      .create({
        body: message.payload.content,
        from: fromNumber,
        to: '+' + message.payload.chatId
      })
      .then(function(message) {
        return when(context.set('messageId', message.sid))
      })
      .then(
        function() {
          resolve(message);
        },
        reject
      );
  });
});

/*
{ ToCountry: 'GB',
  ToState: '',
  SmsMessageSid: 'SMf4e9bcd7fb91702ca8f87c59b2922a73',
  NumMedia: '0',
  ToCity: '',
  FromZip: '',
  SmsSid: 'SMf4e9bcd7fb91702ca8f87c59b2922a73',
  FromState: '',
  SmsStatus: 'received',
  FromCity: '',
  Body: 'this is another answer',
  FromCountry: 'IT',
  To: '<twilio number>',
  MessagingServiceSid: 'MG2c4eb773feb7302ba3170e1d5a581739',
  ToZip: '',
  NumSegments: '1',
  MessageSid: 'SMf4e9bcd7fb91702ca8f87c59b2922a73',
  AccountSid: 'AC905c946541704d7180a03401fcaa5cb8',
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

module.exports = Twilio;





