var _ = require('underscore');
var validators = require('../helpers/validators');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var request = require('request').defaults({ encoding: null });
var utils = require('../../lib/helpers/utils');
var helpers = require('../../lib/helpers/regexps');
var when = utils.when;
var ChatLog = require('../chat-log');
var ViberBot = require('viber-bot').Bot;
var TextMessage = require('viber-bot').Message.Text;
var UrlMessage = require('viber-bot').Message.Url;
var ContactMessage = require('viber-bot').Message.Contact;
var PictureMessage = require('viber-bot').Message.Picture;
var VideoMessage = require('viber-bot').Message.Video;
var LocationMessage = require('viber-bot').Message.Location;
var StickerMessage = require('viber-bot').Message.Sticker;
var RichMediaMessage = require('viber-bot').Message.RichMedia;
var KeyboardMessage = require('viber-bot').Message.Keyboard;


var Viber = new ChatExpress({
  inboundMessageEvent: 'message',
  transport: 'viber',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    //return payload.message_token;
    return payload.sender != null ? payload.sender.id : null;
  },
  userIdKey: function(payload) {
    console.log('rendo userid', payload.sender != null ? payload.sender.id : null);
    return payload.sender != null ? payload.sender.id : null;
  },
  tsKey: function(payload) {
    return moment.unix(payload.timestamp);
  },
  type: function() {
    // todo remove this
  },
  language: function(payload) {
    return payload != null && payload.sender != null ? payload.sender.language : null;
  },
  onStop: function() {

    // todo implement stop
    /*var options = this.getOptions();
    return new Promise(function(resolve) {
      if (options.connector != null) {
        options.connector.stopPolling()
          .then(function() {
            options.connector = null;
            resolve();
          }, function() {
            resolve();
          });
      } else {
        resolve();
      }
    });*/
  },
  onStart: function() {
    var options = this.getOptions();
    console.log('start viber.....', options.token);
    options.connector = new ViberBot({
      authToken: options.token,
      name: "EchoBot", // todo name
      avatar: "http://viber.com/avatar.jpg" // It is recommended to be 720x720, and no more than 100kb.
    });
    return true;
  },
  onStarted: function() {

    var options = this.getOptions();
    var bot = options.connector;
    bot.setWebhook(options.webHook);
    return true;

  },
  routes: {
    '/redbot/viber': function(req, res) {

      //var options = this.getOptions();
      console.log('called middleware', req.body);

      if (req.body.event === 'message') {
        this.receive(req.body);
      }
      // ack
      res.sendStatus(200)
    }
  },
  events: {
    message: function(botMsg) {
      //botMsg.inlineQueryId = botMsg.id;
      //delete botMsg.id;
      this.receive(botMsg);
    }
  }
});



Viber.mixin({
  downloadFile: function (url, token) {
    return new Promise(function (resolve, reject) {
      var options = {
        url: url,
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };
      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }
});

// get plain text messages
Viber.in(function(message) {
  return new Promise(function(resolve, reject) {
    var chatContext = message.chat();
    var payload = message.originalMessage;
    if (payload.message != null && payload.message.type === 'text') {
      message.payload.content = payload.message.text;
      message.payload.type = 'message';
      when(chatContext.set('message', message.payload.content))
        .then(function () {
          resolve(message);
        }, function (error) {
          reject(error);
        });
    } else {
      resolve(message);
    }
  });
});

Viber.out('message', function(message) {
  var connector = message.client();
  var context = message.chat();

  return new Promise(function (resolve, reject) {
    connector
      .sendMessage(message.originalMessage.sender, new TextMessage(message.payload.content))
      .then(function(messageId) {
        return when(context.set('messageId', messageId));
      })
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });

});

module.exports = Viber;
