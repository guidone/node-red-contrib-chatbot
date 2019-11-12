const _ = require('underscore');
const moment = require('moment');
const { ChatExpress, ChatLog } = require('chat-platform');
const { when, request } = require('../../../lib/helpers/utils');
const { fixNumber } = require('./helpers');

/*
  Useful links
  Authenticate
  https://docs.routee.net/docs/get-authenticated
  Send SMS
  https://docs.routee.net/docs/send-a-single-sms-with-callback
  
*/


const Routee = new ChatExpress({
  inboundMessageEvent: null,
  transport: 'routee',
  transportDescription: 'Routee',
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
    return when(true);
  },
  onStop: function() {
    var options = this.getOptions();
    options.connector = null;
    return when(true);
  },
  routes: {
    '/redbot/routee': function(req, res) {
      this.receive(req.body);
      res.send(''); // sending 200 cause an "OK" in whatsup
    }
  },
  routesDescription: {
    '/redbot/routee': 'Routee endpoint for incoming messages'
  }
});

Routee.out('message', function(message) {
  const { fromNumber, accessToken } = this.getOptions();
  const context = message.chat();
  
  console.log('fromNumber, accessToken', fromNumber, accessToken, fixNumber(message.payload.chatId), message.payload.content)

/*
  "method": "POST",
  "headers": {
    "authorization": "Bearer 12dc9fe4-7df4-4786-8d7a-a46d307687f4",
    "content-type": "application/json"
  },
  "processData": false,
  "data": "{ \"body\": \"A new game has been posted to the MindPuzzle. Check it out\",\"to\" : \"+30697XXXXXXX\",\"from\": \"amdTelecom\",\"callback\": { \"strategy\": \"OnCompletion\", \"url\": \"http://www.yourserver.com/message\"}}"
}
*/
  return request({
      method: 'POST',
      headers : {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      json: {
        body: message.payload.content,
        to: fixNumber(message.payload.chatId),
        from: fromNumber
      },
      url: 'https://connect.routee.net/sms'
    })
    .then(res => {
      if (res == null  || res.trackingId == null) {
        throw `${res.developerMessage}: ${JSON.stringify(res.properties)}`;
      } else {
        return when(context.set('messageId', res.trackingId))
      }
    })
    .then(() => message);
});

// log messages, these should be the last
Routee.out(function(message) {
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

Routee.in(function(message) {
  return new Promise(function (resolve) {
    if (!_.isEmpty(message.originalMessage.Body)) {
      message.payload.type = 'message';
      message.payload.content = message.originalMessage.Body;
    }
    resolve(message);
  });
});

Routee.in('*', function(message) {
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

Routee.registerMessageType('message', 'Message', 'Send a plain text message');

module.exports = Routee;





