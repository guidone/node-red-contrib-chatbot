var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var fs = require('fs');
var os = require('os');
var RtmClient = require('@slack/client').RtmClient;
var WebClient = require('@slack/client').WebClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var request = require('request').defaults({ encoding: null });
var ChatLog = require('../chat-log');
var utils = require('../../lib/helpers/utils');
var when = utils.when;

var Slack = new ChatExpress({
  inboundMessageEvent: RTM_EVENTS.MESSAGE,
  transport: 'slack',
  chatIdKey: 'channel',
  userIdKey: 'user',
  tsKey: function(payload) {
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
    } else if (fileMimeType != null ) {
      type = 'document';
    } else if (!_.isEmpty(payload.subtype)) {
      // Slack uses a taxonomy with type and subtype, basically everything is a "message"
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
  },
  routes: {
    '/redbot/slack': function(req, res, next) {
      console.log('arriva!!!', req);
      console.log('arriva!!!', req.body);
      res.sendStatus(200);
    },
    '/redbot/slack/test': function(req, res, next) {
      res.send('ok');
    }
  },
  debug: true
});

Slack.in(function(message) {
  var options = this.getOptions();
  return new Promise(function(resolve) {
    // cleanup the payload
    delete message.payload.source_team;
    delete message.payload.team;
    // if the message has subtype bot_message, then stop if, it's the echo
    if (message.originalMessage.subtype === 'bot_message') {
      return;
    }
    // skip message from the bot
    if (message.originalMessage.username === options.botname) {
      return;
    }
    resolve(message);
  });
});

Slack.in(function(message) {
  var options = this.getOptions();
  var authorizedUsernames = options.authorizedUsernames;
  // check if it's in the list of authorized users
  if (!_.isEmpty(authorizedUsernames)) {
    if (_(authorizedUsernames).contains(message.payload.userId)) {
      return new Promise(function(resolve, reject) {
        return message.chat().set('authorized', true)
          .then(function() {
            resolve(message);
          }, reject);
      });
    }
  }
  return message;
});

Slack.in('message', function(message) {
  return new Promise(function(resolve) {
    message.payload.content = message.originalMessage.text;
    delete message.payload.text;
    resolve(message);
  });
});

Slack.out('message', function(message, connector, server) {
  var options = this.getOptions();
  return new Promise(function(resolve, reject) {
    var client = options.client;
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
  var options = this.getOptions();
  return new Promise(function(resolve, reject) {
    var client = options.client;
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

Slack.out('action', function(message) {
  var connector = this.getConnector();
  return new Promise(function(resolve, reject) {
    connector.sendTyping(message.payload.chatId);
    resolve(message);
  });
});


Slack.in('photo', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(message.originalMessage.file.url_private_download)
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

Slack.out('photo', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer.sendBuffer(message.payload.chatId, message.payload.content, message.payload.filename, message.payload.caption)
      .then(
        function() {
          resolve(message);
        },
        function(error) {
          reject(error);
        });
  });
});

Slack.in('document', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(message.originalMessage.file.url_private_download)
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

Slack.out('document', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer.sendBuffer(message.payload.chatId, message.payload.content, message.payload.filename, message.payload.caption)
      .then(
        function() {
          resolve(message);
        },
        function(error) {
          reject(error);
        });
  });
});

Slack.in('audio', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(message.originalMessage.file.url_private_download)
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

Slack.out('audio', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer.sendBuffer(message.payload.chatId, message.payload.content, message.payload.filename, message.payload.caption)
      .then(
        function() {
          resolve(message);
        },
        function(error) {
          reject(error);
        });
  });
});

Slack.in('video', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(message.originalMessage.file.url_private_download)
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

Slack.out('video', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer.sendBuffer(message.payload.chatId, message.payload.content, message.payload.filename, message.payload.caption)
      .then(
        function() {
          resolve(message);
        },
        function(error) {
          reject(error);
        });
  });
});

Slack.out(function(message) {
  var options = this.getOptions();
  var logfile = options.logfile;
  var chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        var chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  } else {
    return message;
  }
});


Slack.out('inline-buttons', function(message) {

  var chatServer = this;
  var options = this.getOptions();
  return new Promise(function(resolve, reject) {
    var client = options.client;
    client.chat.postMessage(
      message.payload.chatId,
      "Would you like to play a game?",
      {
        "attachments": [
          {
            "text": "Choose a game to play",
            "fallback": "You are unable to choose a game",
            "callback_id": "test",
            "color": "#3AA3E3",
            "attachment_type": "default",
            "actions": [
              {
                "name": "game",
                "text": "Chess",
                "type": "button",
                "value": "chess"
              },
              {
                "name": "game",
                "text": "Falken's Maze",
                "type": "button",
                "value": "maze"
              },
              {
                "name": "game",
                "text": "Thermonuclear War",
                "style": "danger",
                "type": "button",
                "value": "war",
                "confirm": {
                  "title": "Are you sure?",
                  "text": "Wouldn't you prefer a good game of chess?",
                  "ok_text": "Yes",
                  "dismiss_text": "No"
                }
              }
            ]
          }
        ]
      }


      ,
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

// this must be the last
Slack.in('*', function(message) {
  var options = this.getOptions();
  var logfile = options.logfile;
  var chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        var chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  } else {
    return message;
  }
});

Slack.mixin({
  downloadUrl: function(url) {
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
  },
  sendBuffer: function(chatId, buffer, filename, caption) {
    var options = this.getOptions();
    return new Promise(function (resolve, reject) {
      //var client = server.options.client;
      var client = options.client;
      var tmpFile = os.tmpdir() + '/' + filename;
      // create a temp file, then pass as stream
      fs.writeFile(tmpFile, buffer, function(err) {
        if (err) {
          reject(err);
        }
        client.files.upload(
          filename,
          {
            file: fs.createReadStream(tmpFile),
            filetype: 'auto',
            title: caption,
            channels: chatId
          },
          function(err) {
            // uploaded, if no error remove temp file
            if (err) {
              reject(err)
            } else {
              fs.unlink(tmpFile, function() {
                resolve();
              });
            }
          }
        ); // end upload file
      }); // end write file
    });
  }
});

module.exports = Slack;





