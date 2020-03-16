var _ = require('underscore');
var moment = require('moment');
var { ChatExpress, ChatLog } = require('chat-platform');
var utils = require('../../lib/helpers/utils');
var when = utils.when;

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

      //if (req.body.request != null && req.body.request != null) {
        // eslint-disable-next-line no-console
        //console.log(prettyjson.render(req.body.request));
      //}

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
    '/redbot/alexa': 'Use this as Service Endpoint in the Alexa Console',
    '/redbot/alexa/test': 'Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"'
  }
});

var parseIntent = function(request) {

  // set the intent
  var intent = {
    intent: request.intent.name,
    variables: {},
    slotConfirmationStatus: {}
  };
  // set the dialog state and confirmation
  if (!_.isEmpty(request.intent.confirmationStatus)) {
    intent.confirmationStatus = request.intent.confirmationStatus.toLowerCase();
  }
  if (!_.isEmpty(request.dialogState)) {
    intent.dialogState = request.dialogState.toLowerCase();
  }
  // extract slots
  _(request.intent.slots)
    .each(function(slot) {
      intent.variables[slot.name] = slot.value;
        intent.slotConfirmationStatus[slot.name] = _.isString(slot.confirmationStatus) ?
        slot.confirmationStatus.toLowerCase() : 'none';
    });

  return intent;
};

Alexa.in(function(message) {

  var payload = message.originalMessage;

  return new Promise(function(resolve) {

    // skip immediately if request is null
    if (payload.request == null) {
      resolve(message);
    }
    // store the skill id in case it serves multiple skills
    if (payload.session != null && payload.session.application != null) {
      message.originalMessage.applicationId = payload.session.application.applicationId;
    }
    // check type
    switch(payload.request.type) {
      case 'IntentRequest':
        _.extend(message.payload, { type: 'intent' }, parseIntent(payload.request));
        break;
      case 'LaunchRequest':
        // bot is started
        message.payload.type = 'event';
        message.payload.eventType = 'start';
        break;
      case 'SessionEndedRequest':
        message.payload.type = 'event';
        message.payload.eventType = 'endSession';
        break;
      case 'CanFulfillIntentRequest':
        // can fulfil only in US
        break;
    }

    resolve(message);
  });

});

Alexa.out(function(message) {
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

    //console.log('------------------');
    //console.log(alexaMessage);
    //console.log('directives', directives);
    //console.log('cardPayload', cardPayload);
    //console.log('messagePayload', messagePayload);
    //console.log('speechPayload', speechPayload);
    //console.log('repromptPayload', speechPayload);
    //console.log('------------------');

    response.send(alexaMessage);
    resolve(message);
  });
});

// log messages, these should be the last
Alexa.out(function(message) {
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

Alexa.in('*', function(message) {
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
    if (payload.directiveType === 'Dialog.ConfirmSlot') {
      directive.slotToConfirm = payload.slotToConfirm;
    }
    if (payload.directiveType === 'Dialog.ElicitSlot') {
      directive.slotToElicit = payload.slotToElicit;
    }
    return directive;
  }

});


Alexa.registerEvent('start', 'When the session starts');
Alexa.registerEvent('endSession', 'When the session ends');

Alexa.registerMessageType('message', 'Message', 'Send a plain text message');
Alexa.registerMessageType('intent', 'Intent', 'Detected intente (only inbound message)');
Alexa.registerMessageType('event', 'Event', 'Event from platform');
Alexa.registerMessageType('speech', 'Speech', 'Play a speech');
Alexa.registerMessageType('card', 'Card', 'Alexa card');
Alexa.registerMessageType('directive', 'Directive', 'Alexa directive');

module.exports = Alexa;





