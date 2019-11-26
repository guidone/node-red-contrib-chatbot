const _ = require('underscore');
const moment = require('moment');
const { ChatExpress, ChatLog } = require('chat-platform');
const { when, request } = require('../../../lib/helpers/utils');
const { fixNumber, params, fixSenderNumber } = require('./helpers');

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
  color: '#1d5bfe',
  transportDescription: 'Routee',
  tsKey: function() {
    return moment();
  },
  chatIdKey: function(payload) {
    return payload.from;
  },
  userIdKey: function(payload) {
    return payload.from;
  },
  onStart: function() {
    return when(true);
  },
  onStop: function() {
    var options = this.getOptions();
    options.connector = null;
    return when(true);
  },
  routes: {
    '/redbot/routee': function(req, res) {
      /*
      { from: '+393473561058',
        to: '+447451277978',
        messageId: '5e6f83bf-83f2-4efc-8f21-6d07953ceb58',
        message: 'test inbound',
        parts: 1,
        receivedDate: '2019-11-12T20:41:25Z',
        direction: 'Inbound',
        originatingService: 'Sms',
        price: 0.006 
      }
      */
      this.receive(req.body);
      res.send('');
    }
  },
  routesDescription: {
    '/redbot/routee': 'Routee endpoint for incoming messages'
  }
});

Routee.out('message', function(message) {
  let { fromNumber, accessToken } = this.getOptions();
  const context = message.chat();
  const { payload } = message;
  const param = params(message);
  
  return request({
      method: 'POST',
      headers : {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json'
      },
      json: {
        body: message.payload.content,
        to: fixNumber(message.payload.chatId),
        from: fixSenderNumber(param('fromNumber', fromNumber))
      },
      url: 'https://connect.routee.net/sms'
    })
    .then(res => {
      if (_.isObject(res) && res.error != null) {
        throw `${res.error}: ${JSON.stringify(res)}`;
      } else if (res == null  || res.trackingId == null) {
        throw `${res.developerMessage}: ${JSON.stringify(res.properties)}`;
      } else {
        return when(context.set('messageId', res.trackingId))
      }
    })
    .then(() => message);
});

// log messages, these should be the last
Routee.out(function(message) {
  const { logfile } = this.getOptions();
  const chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(variables => {
        const chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Routee.in(function(message) {
  const chatContext = message.chat();
  if (!_.isEmpty(message.originalMessage.message)) {
    message.payload.type = 'message';
    message.payload.content = message.originalMessage.message;
    return when(chatContext.set('inboundNumber', message.originalMessage.to))
      .then(() => message);
  }
  return message;
});

Routee.in('*', function(message) {
  const { logfile } = this.getOptions();
  const chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(variables => {
        const chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Routee.registerMessageType('message', 'Message', 'Send a plain text message');

Routee.registerParam(
  'fromNumber',
  'string',
  { label: 'Originator number', description: 'Override the "fromNumber" originator number defined in the chatbot configuration' }
);
Routee.registerParam(
  'anotherParam',
  'string',
  { label: 'Another Param 1', description: 'This is description 2' }
);

module.exports = Routee;





