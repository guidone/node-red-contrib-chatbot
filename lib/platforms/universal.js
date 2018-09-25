var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');

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
  }
});

module.exports = Universal;
