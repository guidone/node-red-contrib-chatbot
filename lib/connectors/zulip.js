var _ = require('underscore');
var validators = require('../helpers/validators');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var TelegramBot = require('node-telegram-bot-api');
var request = require('request').defaults({ encoding: null });
var utils = require('../../lib/helpers/utils');
var when = utils.when;
var ChatLog = require('../chat-log');

var Zulip = new ChatExpress({
  inboundMessageEvent: 'message',
  transport: 'zulip',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    return payload.chat != null ? payload.chat.id : null;
  },
  userIdKey: function(payload) {
    return payload.from.username;
  },
  tsKey: function(payload) {
    return moment.unix(payload.date);
  },
  type: function() {
    // todo remove this
  },
  onStop: function() {
    var options = this.getOptions();
    /*return new Promise(function(resolve) {
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
    /*options.connector = new TelegramBot(options.token, {
      polling: {
        params: {
          timeout: 10
        },
        interval: !isNaN(parseInt(options.polling, 10)) ? parseInt(options.polling, 10) : 1000
      }
    });*/
    //options.connector.setMaxListeners(0);
    return true;
  },
  events: {
    inline_query: function(botMsg) {

    }
  },
  routes: {
    '/redbot/zulip': function (req, res) {
      var payload = req.body;
      console.log('recevied', payload);
    }
  },


  debug: true
});



module.exports = Zulip;
