var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var utils = require('../../lib/helpers/utils');
var when = utils.when;
var _ = require('underscore');

var Universal = new ChatExpress({
  transport: 'universal',
  transportDescription: 'Universal Connector',
  chatIdKey: function(payload) {
    return payload.chatId;
  },
  userIdKey: function(payload) {
    return payload.userId;
  },
  tsKey: function() {
    return moment();
  },
  language: function() {
    return null;
  },
  onStart: function() {
    var options = this.getOptions();
    return _.isFunction(options._onStart) ? when(options._onStart()) : when(true);
  },
  onStop: function() {
    var options = this.getOptions();
    return _.isFunction(options._onStop) ? when(options._onStop()) : when(true);
  }
});


Universal.mixin({
  onStart: function(func) {
    var options = this.getOptions();
    options._onStart = func.bind(this);
    return this;
  },
  onStop: function(func) {
    var options = this.getOptions();
    options._onStop = func.bind(this);
    return this;
  }
});

module.exports = Universal;
