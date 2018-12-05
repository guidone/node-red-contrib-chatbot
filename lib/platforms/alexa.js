var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var RtmClient = require('@slack/client').RTMClient;
var WebClient = require('@slack/client').WebClient;

var request = require('request').defaults({ encoding: null });
var ChatLog = require('../chat-log');
var utils = require('../../lib/helpers/utils');
var when = utils.when;


/*

- Send a message, upload file: https://slackapi.github.io/node-slack-sdk/web_api#posting-a-message


*/

var Alexa = new ChatExpress({
  transport: 'alexa',
  bundle: true,
  transportDescription: 'Alexa',
  chatIdKey: function(payload) {
    if (payload != null && payload.session != null && payload.session.user != null) {
      return payload.session.user.userId;
    }
  },
  //userIdKey: 'user',
  tsKey: function(payload) {
    return moment(); // todo fix
    //return moment.unix(payload.ts);
  },

  routes: {
    '/redbot/alexa': function(req, res) {

      console.log('req', req);

      //console.log('incoming...', req.body);


      var cloned = _.clone(req.body);
      // include http response in the original message, will be used to send response
      cloned.getResponse = function() {
        return res;
      };

      // todo also add the res object
      this.receive(cloned);
    },
    '/redbot/alexa/test': function(req, res) {
      res.send('ok');
    }
  },
  routesDescription: {
    // todo fix description
    '/redbot/alexa': 'Use this in the "Request URL" of the "Interactive Components" of your Slack App',
    '/redbot/alexa/test': 'Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"'
  }
});

Alexa.in(function(message) {

  var payload = message.originalMessage;

  return new Promise(function(resolve, reject) {


    if (payload.request != null && payload.request.type === 'IntentRequest') {

      // todo extract slots
      message.payload.type = 'intent';
      message.payload.intent = payload.request.intent.name;

      console.log('ok detected', message.payload);

    }

    resolve(message);
  });

});

Alexa.out(function(message) {
  console.log('outing....');
  console.log(message.payload);
  console.log('-------');
  var server = this;
  var payload = message.payload;
  return new Promise(function(resolve) {
    var response = message.originalMessage.getResponse();

    var alexaMessage = server.responseEnvelope();

    var messagePayload = _(payload).findWhere({ type: 'message' });
    var cardPayload = _(payload).findWhere({ type: 'card' });

    console.log('cardPayload', cardPayload);

    if (message != null) {
      alexaMessage.response.outputSpeech = server.messagePayload(messagePayload);
    }
    if (cardPayload != null) {
      alexaMessage.response.card = server.cardPayload(cardPayload);
    }


    console.log('---', alexaMessage);


    response.send(alexaMessage);
    resolve(message);
  });
});

Alexa.mixin({

  responseEnvelope: function() {
    return {
      version: '1.0',
      response: {
        shouldEndSession: true
      }
    };
  },

  cardPayload: function(payload) {
    switch(payload.cardType) {
      case 'simple':
        return {
          type: 'Simple',
          title: payload.title,
          content: payload.content
        };
      case 'standard':
        return {
          type: 'Standard',
          title: payload.title,
          text: payload.text,
          smallImage: payload.smallImage,
          largeImage: payload.largeImage
        };
    }
  },

  messagePayload: function(payload) {
    return {
      type: 'PlainText',
      text: payload.content
    };
  }

});


Alexa.registerMessageType('message', 'Message', 'Send a plain text message');
Alexa.registerMessageType('intent', 'Intent', 'Detected intente (only inbound message)');


module.exports = Alexa;





