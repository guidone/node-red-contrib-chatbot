var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var RtmClient = require('@slack/client').RTMClient;
var WebClient = require('@slack/client').WebClient;

var request = require('request').defaults({ encoding: null });
var ChatLog = require('../chat-log');
var utils = require('../../lib/helpers/utils');
var when = utils.when;

var AlexaMessageBuilder = require('alexa-message-builder');

/*

- Send a message, upload file: https://slackapi.github.io/node-slack-sdk/web_api#posting-a-message


*/

var Alexa = new ChatExpress({
  transport: 'alexa',
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
    console.log('-----in', _.omit(payload, 'response'));

    if (payload.request != null && payload.request.type === 'IntentRequest') {

      // todo extract slots
      message.payload = {
        type: 'intent',
        intent: payload.request.intent.name
      };

      console.log('ok detected', message.payload);

    }

    resolve(message);
  });

});

Alexa.out('message', function(message) {
  console.log('outing-....');
  return new Promise(function(resolve) {
    var response = message.originalMessage.getResponse();
    var alexaMessage = new AlexaMessageBuilder()
      .addText('Hello from Alexa')
      .get();

    console.log('message', alexaMessage);

    response.send(alexaMessage);
    resolve(message);
  });
});

Alexa.registerMessageType('message', 'Message', 'Send a plain text message');


module.exports = Alexa;





