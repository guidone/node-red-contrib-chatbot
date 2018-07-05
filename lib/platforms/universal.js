var _ = require('underscore');
var validators = require('../helpers/validators');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var request = require('request').defaults({ encoding: null });
var utils = require('../../lib/helpers/utils');
var helpers = require('../../lib/helpers/regexps');
var when = utils.when;
var ChatLog = require('../chat-log');

var Universal = new ChatExpress({
  inboundMessageEvent: 'message',
  transport: 'universal',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    return payload.chatId;
  },
  userIdKey: function(payload) {
    //return payload.from.username;
    return payload.userId;
  },
  tsKey: function(payload) {
    //return moment.unix(payload.date);
    return moment();
  },
  type: function() {
    // todo remove this
  },
  language: function(payload) {
    //return payload != null && payload.from != null ? payload.from.language_code : null;
    return 'it';
  }

});

module.exports = Universal;
