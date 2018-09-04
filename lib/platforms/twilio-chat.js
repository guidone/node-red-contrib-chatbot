var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var fs = require('fs');
var os = require('os');

var request = require('request').defaults({ encoding: null });
var ChatLog = require('../chat-log');
var utils = require('../../lib/helpers/utils');
var when = utils.when;

var Twilio = new ChatExpress({
  //inboundMessageEvent: RTM_EVENTS.MESSAGE,
  transport: 'twilio',
  chatIdKey: 'channel',
  userIdKey: 'user',
  /*tsKey: function(payload) {
    return moment.unix(payload.ts);
  },
  type: function(payload) {
    var type = payload.type;
    // get mime if any file
    var fileMimeType = payload.subtype === 'file_share' ? payload.file.mimetype : null;
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
  },
  onStop: function() {
    var options = this.getOptions();
    options.connector.disconnect();
    return true;
  },
  onStart: function() {
    var options = this.getOptions();
    options.connector = new RtmClient(options.token);
    options.connector.start();
    options.client = new WebClient(options.token);
    if (_.isEmpty(options.botname)) {
      this.warn('Param "botname" is empty, this is needed to detect echo messages from the bot itself and can, '
        + 'cause endless circular effect.');
    }
    return true;
  },*/
  routes: {

  },
  routesDescription: {

  }
});


Twilio.mixin({

});

module.exports = Twilio;





