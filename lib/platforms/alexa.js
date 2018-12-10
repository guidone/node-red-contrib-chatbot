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
  userIdKey: function(payload) {
    if (payload != null && payload.session != null && payload.session.user != null) {
      return payload.session.user.userId;
    }
  },
  language: function(payload) {
    if (payload != null && payload.request != null && payload.request.locale != null) {
      return payload.request.locale;
    }
  },
  tsKey: function() {
    return moment();
  },

  routes: {
    '/redbot/alexa': function(req, res) {

      // DEBUG
      //console.log('+++++++++++++++++++++++++++++++');
      //console.log(req.body);
      //console.log('LOG REQUEST', cloned.request);
      //console.log('+++++++++++++++++++++++++++++++');
      var cloned = _.clone(req.body);

      // include http response in the original message, will be used to send response
      cloned.getResponse = function() {
        return res;
      };

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

  return new Promise(function(resolve) {


    if (payload.request != null && payload.request.type === 'IntentRequest') {

      // set the intent
      message.payload.type = 'intent';
      message.payload.intent = payload.request.intent.name;
      // set the dialog state and confirmation
      message.payload.confirmationStatus = payload.request.intent.confirmationStatus.toLowerCase();
      if (!_.isEmpty(payload.request.dialogState)) {
        message.payload.dialogState = payload.request.dialogState.toLowerCase();
      }
      // extract slots
      message.payload.variables = {};
      _(payload.request.intent.slots)
        .each(function(slot) {
          message.payload.variables[slot.name] = slot.value;
        });

      //console.log('ok detected', message.payload);

    } else if (payload.request != null && payload.request.type === 'LaunchRequest') {
      // bot is started
      message.payload.type = 'event';
      message.payload.eventType = 'start';
    }



    resolve(message);
  });

});

Alexa.out(function(message) {
  console.log('outing....');
  console.log(message.payload);
  console.log('-------');
  var server = this;
  var payload = _.isArray(message.payload) ? message.payload : [message.payload];
  return new Promise(function(resolve) {
    var response = message.originalMessage.getResponse();

    var alexaMessage = server.responseEnvelope();

    var messagePayload = _(payload).findWhere({ type: 'message' });
    var cardPayload = _(payload).findWhere({ type: 'card' });
    var endSession = _(payload).findWhere({ type: 'directive', directiveType: 'EndSession' }) != null;
    var speechPayload = _(payload).findWhere({ type: 'speech', reprompt: false });
    var repromptPayload = _(payload).findWhere({ type: 'speech', reprompt: true });

    var directives = _(payload)
      .chain()
      .filter(function(payload) {
        return payload.type === 'directive' && payload.directiveType !== 'EndSession';
      })
      .map(function(payload) {
        return server.translateDirective(payload);
      })
      .value();

    /*console.log('------------------');
    console.log('directives', directives);
    console.log('cardPayload', cardPayload);
    console.log('messagePayload', messagePayload);
    console.log('speechPayload', speechPayload);
    console.log('repromptPayload', speechPayload);
    console.log('------------------');*/

    alexaMessage.response.shouldEndSession = endSession;
    if (speechPayload != null) {
      alexaMessage.response.outputSpeech = server.speechPayload(speechPayload);
    } else if (messagePayload != null) {
      alexaMessage.response.outputSpeech = server.messagePayload(messagePayload);
    }
    if (cardPayload != null) {
      alexaMessage.response.card = server.cardPayload(cardPayload);
    }
    if (repromptPayload != null) {
      alexaMessage.response.reprompt = server.speechPayload(repromptPayload);
    }
    if (!_.isEmpty(directives)) {
      alexaMessage.response.directives = directives;
    }

    response.send(alexaMessage);
    resolve(message);
  });
});

Alexa.mixin({

  responseEnvelope: function() {
    return {
      version: '1.0',
      response: {
        shouldEndSession: false
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

  speechPayload: function(payload) {
    return {
      type: payload.speechType,
      playBehavior: payload.playBehavior,
      text: payload.speechType === 'PlainText' ? payload.text : undefined,
      ssml: payload.speechType === 'SSML' ? payload.ssml : undefined
    };
  },

  messagePayload: function(payload) {
    return {
      type: 'PlainText',
      text: payload.content
    };
  },

  translateDirective: function(payload) {
    var directive = {
      type: payload.directiveType
    };

    return directive;
  }

});


Alexa.registerMessageType('message', 'Message', 'Send a plain text message');
Alexa.registerMessageType('intent', 'Intent', 'Detected intente (only inbound message)');
Alexa.registerMessageType('event', 'Event', 'Event from platform');

module.exports = Alexa;





