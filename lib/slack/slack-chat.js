var _ = require('underscore');
var ChatExpress = require('../chat-platform/chat-platform');

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var request = require('request').defaults({ encoding: null });


var Slack = new ChatExpress({

  inboundMessageEvent: RTM_EVENTS.MESSAGE,
  transport: 'slack',
  chatIdKey: 'channel'
});

Slack.use(function(message) {
  // Slack uses a taxonomy with type and subtype, basically everything is a "message"
  return new Promise(function(resolve) {
    if (!_.isEmpty(message.payload.subtype)) {
      message.payload.type = message.payload.subtype;
    }

    // cleanup the payload
    delete message.payload.source_team;
    delete message.payload.team;

    resolve(message);
  });
});

function downloadFile(url) {
  return new Promise(function(resolve, reject) {
    var options = {
      url: url
    };
    request(options, function(error, response, body) {
      if (error) {
        reject('Unable to download file ' + url);
      } else {
        resolve(body);
      }
    });
  });
}


Slack.in('message', function(message) {

  return new Promise(function(resolve, reject) {
    resolve(message);
  });
});

Slack.in('file_share', function(message) {
  return new Promise(function(resolve, reject) {

    downloadFile(message.payload.file.url_private_download)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function(error) {
          reject('Error loading: ' + message.payload.file.url_private_download)
        });
  });
});

/*Slack.in('message', function(message) {

  return new Promise(function(resolve, reject) {
    resolve(message);
  });
});*/


Slack.in('vanity', function(message) {

  return new Promise(function(resolve, reject) {

    console.log('I am just a middleware for vanity---', message);
    resolve(message);

  });


});


/*Slack.use(function(message) {

});*/




module.exports = Slack;





