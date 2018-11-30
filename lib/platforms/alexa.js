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
  transportDescription: 'Alexa',
  //chatIdKey: 'channel',
  //userIdKey: 'user',
  tsKey: function(payload) {
    return moment(); // todo fix
    //return moment.unix(payload.ts);
  },
  /*type: function(payload) {
    var type = payload.type;
    // get mime if any file
    var fileMimeType = _.isArray(payload.files) && !_.isEmpty(payload.files) ? payload.files[0].mimetype : null;
    // convert message type
    if (fileMimeType != null && fileMimeType.indexOf('image') !== -1) {
      type = 'photo';
    } else if (fileMimeType != null && fileMimeType.indexOf('audio') !== -1) {
      type = 'audio';
    } else if (fileMimeType != null && fileMimeType.indexOf('video') !== -1) {
      type = 'video';
    } else if (fileMimeType != null) {
      type = 'document';
    } else if (!_.isEmpty(payload.subtype)) {
      // slack uses a taxonomy with type and subtype, basically everything is a "message"
      type = payload.subtype;
    }
    return type;
  },*/
  /*onStop: function() {
    var options = this.getOptions();
    options.connector.disconnect();
    return true;
  },
  onStart: function() {
    var chatServer = this;
    var options = this.getOptions();

    options.connector = new RtmClient(options.token);
    options.connector.start();
    // needed to send messages with attachments
    options.client = new WebClient(options.token);

    options.connector.on('message', function(message) {
      // For structure of `event`, see https://api.slack.com/events/message
      // skipe messages from the bot, do not re-introduce in the flow
      if ( (message.subtype && message.subtype === 'bot_message') ||
        (!message.subtype && message.user === options.connector.activeUserId) ) {
        return;
      }

      chatServer.receive(message);
    });
    return true;
  },*/
  routes: {
    '/redbot/alexa': function(req, res) {
      var payload = this.parsePayload(req.body);


      /*if (payload != null && payload.type === 'interactive_message' && payload.actions[0].value.indexOf('dialog_') !== -1) {
        // if it's the callback of a dialog button, then relay a dialog message
        this.receive({
          type: 'dialog',
          channel: payload.channel.id,
          user: payload.user.id,
          text: payload.actions[0].value.replace('dialog_', ''),
          ts: payload.action_ts,
          trigger_id: payload.trigger_id,
          callback_id: payload.callback_id
        });
        // if there's feedback, send it back, otherwise do nothing
        if (!_.isEmpty(this.getButtonFeedback(payload.actions[0].name))) {
          res.send({
            response_type: 'ephemeral',
            replace_original: false,
            text: this.getButtonFeedback(payload.actions[0].name)
          });
        } else {
          res.sendStatus(200); // generic answer
        }
      } else if (payload != null && payload.type === 'interactive_message') {
        // relay a message with the value of the button
        this.receive({
          type: 'message',
          channel: payload.channel.id,
          user: payload.user.id,
          text: payload.actions[0].value,
          ts: payload.action_ts,
          trigger_id: payload.trigger_id,
          callback_id: payload.callback_id
        });
        // if there's feedback, send it back, otherwise do nothing
        if (!_.isEmpty(this.getButtonFeedback(payload.actions[0].name))) {
          res.send({
            response_type: 'ephemeral',
            replace_original: false,
            text: this.getButtonFeedback(payload.actions[0].name)
          });
        } else {
          res.sendStatus(200); // generic answer
        }
      } else if (payload.type === 'dialog_submission') {
        // intercept a dialog response and relay
        this.receive({
          type: 'response',
          channel: payload.channel.id,
          user: payload.user.id,
          response: payload.submission,
          ts: payload.action_ts,
          trigger_id: payload.trigger_id,
          callback_id: payload.callback_id
        });
        res.send(''); // 200 empty body
      } else {
        res.sendStatus(200);
      }*/
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
  return new Promise(function(resolve) {
    // cleanup the payload
    delete message.payload.source_team;
    delete message.payload.team;
    // todo check if necessary
    // echo after a button is clicked, discard
    if (message.originalMessage.subtype === 'message_changed') {
      return;
    }
    resolve(message);
  });
});


Alexa.mixin({

});



module.exports = Alexa;





