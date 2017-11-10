var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var request = require('request').defaults({ encoding: null });


var Slack = new ChatExpress({
  inboundMessageEvent: RTM_EVENTS.MESSAGE,
  transport: 'slack',
  chatIdKey: 'channel',
  userIdKey: 'user',
  tsKey: function(payload) {
    return moment.unix(payload.ts);
  }
});

Slack.in(function(message) {
  // Slack uses a taxonomy with type and subtype, basically everything is a "message"
  return new Promise(function(resolve) {
    // if the message has subtype bot_message, then stop if, it's the echo
    if (message.payload.type === 'message' && message.payload.subtype === 'bot_message') {
      return;
    }

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
  return new Promise(function(resolve) {
    message.payload.content = message.payload.text;
    delete message.payload.text;
    resolve(message);
  });
});

Slack.out('message', function(message, connector, server) {
  return new Promise(function(resolve, reject) {
    var client = server.options.client;
    client.chat.postMessage(
      message.payload.chatId,
      message.payload.content,
      function(err, res) {
        if (err) {
          reject(err)
        } else {
          resolve(message);
        }
      }
    );
  });
});

Slack.out('location', function(message, connector, server) {
  return new Promise(function(resolve, reject) {
    var client = server.options.client;
    // build map link
    var link = 'https://www.google.com/maps?f=q&q=' + message.payload.content.latitude + ','
      + message.payload.content.longitude + '&z=16';
    // send simple attachment
    var attachments = [
      {
        'author_name': 'Position',
        'title': link,
        'title_link': link,
        'color': '#7CD197'
      }
    ];
    client.chat.postMessage(
      message.payload.chatId,
      '',
      {
        attachments: attachments
      },
      function(err, res) {
        if (err) {
          reject(err)
        } else {
          resolve(message);
        }
      }
    );
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


module.exports = Slack;





