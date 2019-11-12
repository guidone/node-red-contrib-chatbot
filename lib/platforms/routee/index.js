const _ = require('underscore');
const moment = require('moment');
const { ChatExpress, ChatLog } = require('chat-platform');
const utils = require('../../../lib/helpers/utils');
const when = utils.when;
const helpers = require('./helpers');
const fixNumber = helpers.fixNumber;



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
    //options.connector = twilio(options.accountSid, options.authToken);
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
  var options = this.getOptions();
  var context = message.chat();
  var client = message.client();
  var fromNumber = options.fromNumber;

  return new Promise(function (resolve, reject) {
    client.messages
      .create({
        body: message.payload.content,
        from: fixNumber(fromNumber),
        to: fixNumber(message.payload.chatId)
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





