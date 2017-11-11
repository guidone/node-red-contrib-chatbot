var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var fs = require('fs');
var os = require('os');
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
  return new Promise(function(resolve) {
    // cleanup the payload
    delete message.payload.source_team;
    delete message.payload.team;
    // if the message has subtype bot_message, then stop if, it's the echo
    if (message.originalMessage.type === 'message' && message.originalMessage.subtype === 'bot_message') {
      return;
    }
    // todo parametrize this
    if (message.originalMessage.username === 'guidone_bot') {
      return;
    }
    // get mime if any file
    var fileMimeType = message.originalMessage.subtype === 'file_share' ? message.originalMessage.file.mimetype : null;


    if (fileMimeType != null && fileMimeType.indexOf('image') !== -1) {
      message.payload.type = 'photo';
    } else if (fileMimeType != null ) {
      message.payload.type = 'document';
    } else if (!_.isEmpty(message.originalMessage.subtype)) {
      // Slack uses a taxonomy with type and subtype, basically everything is a "message"
      message.payload.type = message.originalMessage.subtype;
    }

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
    message.payload.content = message.originalMessage.text;
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

Slack.in('photo', function(message) {
  return new Promise(function(resolve, reject) {
    downloadFile(message.originalMessage.file.url_private_download)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function() {
          reject('Error loading: ' + message.payload.file.url_private_download)
        });
  });
});

Slack.out('photo', function(message, connector, server) {
  return new Promise(function (resolve, reject) {
    var client = server.options.client;
    var tmpFile = os.tmpdir() + '/' + message.payload.filename;
    // create a temp file, then pass as stream
    fs.writeFile(tmpFile, message.payload.content, function(err) {
      if (err) {
        reject(err);
      }
      client.files.upload(
        message.payload.filename,
        {
          file: fs.createReadStream(tmpFile),
          filetype: 'auto',
          title: message.payload.caption,
          channels: message.payload.chatId
        },
        function(err) {
          // uploaded, if no error remove temp file
          if (err) {
            reject(err)
          } else {
            fs.unlink(tmpFile, function() {
              resolve(message);
            });
          }
        }
      ); // end upload file
    }); // end write file
  });
});

module.exports = Slack;





