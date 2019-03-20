var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var RtmClient = require('@slack/client').RTMClient;
var WebClient = require('@slack/client').WebClient;
var lcd = require('../helpers/lcd');

var request = require('request').defaults({ encoding: null });
var ChatLog = require('../chat-log');
var utils = require('../../lib/helpers/utils');
var when = utils.when;

/*

- Send a message, upload file: https://slackapi.github.io/node-slack-sdk/web_api#posting-a-message


*/

var Slack = new ChatExpress({
  transport: 'slack',
  transportDescription: 'Slack',
  chatIdKey: 'channel',
  userIdKey: 'user',
  tsKey: function(payload) {
    return moment.unix(payload.ts);
  },
  type: function(payload) {
    var type = payload.type;
    // get mime if any file
    var fileMimeType = _.isArray(payload.files) && !_.isEmpty(payload.files) ? payload.files[0].mimetype : null;
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
    var chatServer = this;
    var options = this.getOptions();

    options.connector = new RtmClient(options.token);
    options.connector.start();
    // needed to send messages with attachments
    options.client = new WebClient(options.token);

    options.connector.on('message', function(message) {
      // For structure of `event`, see https://api.slack.com/events/message
      // skipe messages from the bot, do not re-introduce in the flow
      if ( (message.subtype && message.subtype === 'bot_message') ||
        (!message.subtype && message.user === options.connector.activeUserId) ) {
        return;
      }

      chatServer.receive(message);
    });
    return true;
  },
  routes: {
    '/redbot/slack/command': function(req, res) {
      this.receive({
        type: 'message',
        channel: req.body.channel_id,
        user: req.body.user_id,
        text: req.body.command + ' ' + req.body.text,
        trigger_id: req.body.trigger_id,
        ts: moment().unix()
      });
      res.send(''); // 200 empty body
    },
    '/redbot/slack/test': function(req, res) {
      res.send('ok');
    },
    '/redbot/slack': function(req, res) {
      var payload = this.parsePayload(req.body);
      if (payload != null && payload.type === 'interactive_message' && payload.actions[0].value.indexOf('dialog_') !== -1) {
        // if it's the callback of a dialog button, then relay a dialog message
        this.receive({
          type: 'dialog',
          channel: payload.channel.id,
          user: payload.user.id,
          text: payload.actions[0].value.replace('dialog_', ''),
          ts: payload.action_ts,
          trigger_id: payload.trigger_id,
          callback_id: payload.callback_id
        });
        // if there's feedback, send it back, otherwise do nothing
        if (!_.isEmpty(this.getButtonFeedback(payload.actions[0].name))) {
          res.send({
            response_type: 'ephemeral',
            replace_original: false,
            text: this.getButtonFeedback(payload.actions[0].name)
          });
        } else {
          res.send(''); // generic answer
        }
      } else if (payload != null && payload.type === 'interactive_message') {
        // relay a message with the value of the button
        this.receive({
          type: 'message',
          channel: payload.channel.id,
          user: payload.user.id,
          text: payload.actions[0].value,
          ts: payload.action_ts,
          trigger_id: payload.trigger_id,
          callback_id: payload.callback_id
        });
        // if there's feedback, send it back, otherwise do nothing
        if (!_.isEmpty(this.getButtonFeedback(payload.actions[0].name))) {
          res.send({
            response_type: 'ephemeral',
            replace_original: false,
            text: this.getButtonFeedback(payload.actions[0].name)
          });
        } else {
          res.send(''); // generic answer
        }
      } else if (payload.type === 'dialog_submission') {
        // intercept a dialog response and relay
        this.receive({
          type: 'response',
          channel: payload.channel.id,
          user: payload.user.id,
          response: payload.submission,
          ts: payload.action_ts,
          trigger_id: payload.trigger_id,
          callback_id: payload.callback_id
        });
        res.send(''); // 200 empty body
      } else {
        res.sendStatus(200);
      }
    }
  },
  routesDescription: {
    '/redbot/slack': 'Use this in the "Request URL" of the "Interactive Components" of your Slack App',
    '/redbot/slack/command': 'Endpoint for Slack command',
    '/redbot/slack/test': 'Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"'
  }
});

Slack.in(function(message) {
  return new Promise(function(resolve) {
    // cleanup the payload
    delete message.payload.source_team;
    delete message.payload.team;
    // todo check if necessary
    // echo after a button is clicked, discard
    if (message.originalMessage.subtype === 'message_changed') {
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
        return when(message.chat().set('authorized', true))
          .then(function() {
            resolve(message);
          }, reject);
      });
    }
  }
  return message;
});

Slack.in('message', function(message) {
  return new Promise(function(resolve, reject) {
    var chatContext = message.chat();
    message.payload.content = message.originalMessage.text;
    delete message.payload.text;
    when(chatContext.set('message', message.payload.content))
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });
});

Slack.in('dialog', function(message) {
  message.payload.content = message.originalMessage.text;
  return message;
});

Slack.in('response', function(message) {
  message.payload.content = message.originalMessage.response;
  return message;
});

Slack.out('dialog', function(message) {
  var options = this.getOptions();
  var client = options.client;

  return new Promise(function(resolve, reject) {
    // map some element in order to change var conventions
    var elements = _(message.payload.elements)
      .map(function(item) {
        var element = _.clone(item);
        element.max_length = element.maxLength;
        element.min_length = element.minLength;
        delete element.minLength;
        delete element.maxLength;
        return element;
      });

    var dialog = {
      callback_id: message.originalMessage.callback_id,
      title: message.payload.title,
      submit_label: message.payload.submitLabel,
      elements: elements
    };

    client.dialog.open({ dialog: JSON.stringify(dialog), trigger_id: message.originalMessage.trigger_id })
      .then(
        function() {
          resolve(message);
        },
        reject
      );
  });
});

Slack.out('message', function(message) {
  var options = this.getOptions();
  var slackExtensions = this.getSlackExtensions();
  var chatContext = message.chat();
  return new Promise(function(resolve, reject) {
    var client = options.client;
    var payload = Object.assign({ channel: message.payload.chatId, text: message.payload.content }, slackExtensions);

    client.chat.postMessage(payload)
      .then(function(res) {
        return when(chatContext.set('messageId', res.ts));
      })
      .then(
        function() {
          resolve(message);
        },
        function(error) {
          reject(error);
        }
      );
  });
});

Slack.out('location', function(message) {
  var options = this.getOptions();
  var slackExtensions = this.getSlackExtensions();
  return new Promise(function(resolve, reject) {
    var client = options.client;
    // build map link
    var link = 'https://www.google.com/maps?f=q&q=' + message.payload.content.latitude + ','
      + message.payload.content.longitude + '&z=16';
    // send simple attachment
    var attachments = [
      {
        'author_name': !_.isEmpty(message.payload.place) ? message.payload.place : 'Position',
        'title': link,
        'title_link': link,
        'color': '#7CD197'
      }
    ];
    var payload = Object.assign({
        channel: message.payload.chatId,
        text: '',
        attachments: attachments
    }, slackExtensions);
    client.chat
      .postMessage(payload)
      .then(
        function() {
          resolve(message);
        },
        reject
      );
  });
});

Slack.out('action', function(message) {
  var connector = this.getConnector();
  return new Promise(function(resolve) {
    connector.sendTyping(message.payload.chatId);
    resolve(message);
  });
});


Slack.in('photo', function(message) {
  var chatServer = this;
  var url = message.originalMessage.files[0].url_private_download;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(url)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function(e) {
          reject('Photo Error: ' + e);
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
  var url = message.originalMessage.files[0].url_private_download;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(url)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function(e) {
          reject('Document Error: ' + e)
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
  var url = message.originalMessage.files[0].url_private_download;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(url)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function(e) {
          reject('Audio Error: ' + e)
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
  var url = message.originalMessage.files[0].url_private_download;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(url)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function(e) {
          reject('Video Error: ' + e)
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

Slack.out('inline-buttons', function(message) {
  var options = this.getOptions();
  var slackExtensions = this.getSlackExtensions();
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    var client = options.client;
    var payload = {
        channel: message.payload.chatId,
        text: message.payload.content,
        attachments: [
          {
            'text': message.payload.content,
            callback_id: !_.isEmpty(message.payload.name) ? message.payload.name : _.uniqueId('callback_'),
            color: '#3AA3E3',
            attachment_type: 'default',
            actions: chatServer.parseButtons(message.payload.buttons)
          }
        ]
    };
    payload = Object.assign(payload, slackExtensions);
    client.chat
      .postMessage(payload)
      .then(
        function() {
          resolve(message);
        },
        reject
      );
  });
});

// todo classes only when selected

Slack.out('generic-template', function(message) {
  var chatServer = this;
  var options = this.getOptions();
  var chatContext = message.chat();
  var slackExtensions = this.getSlackExtensions();
  return new Promise(function(resolve, reject) {
    var client = options.client;
    var attachments = _(message.payload.elements).map(function(item) {
      var attachment = {
        title: item.title,
        callback_id: !_.isEmpty(item.title) ? item.title : _.uniqueId('callback_'),
        actions: chatServer.parseButtons(item.buttons)
      };
      if (!_.isEmpty(item.subtitle)) {
        attachment.text = item.subtitle;
      }
      if (!_.isEmpty(item.imageUrl)) {
        attachment.image_url = item.imageUrl;
      }
      return attachment;
    });

    var payload = {
      channel: message.payload.chatId,
      text: message.payload.content,
      attachments: attachments
    };
    payload = Object.assign(payload, slackExtensions);

    client.chat
      .postMessage(payload)
      .then(function(res) {
        return when(chatContext.set('messageId', res.ts));
      })
      .then(
        function() {
          resolve(message);
        },
        reject
      );
  });
});

// log messages, these should be the last
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
  }
  return message;
});

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
  }
  return message;
});

Slack.mixin({

  getSlackExtensions: function() {
    var options = this.getOptions();

    var slackExtensions = {};
    if (!_.isEmpty(options.username)) {
      slackExtensions.username = options.username;
      slackExtensions.as_user = false;
    }
    if (!_.isEmpty(options.iconEmoji)) {
      slackExtensions.icon_emoji = options.iconEmoji;
      slackExtensions.as_user = false;
    }

    return slackExtensions;
  },

  parseButtons: function(buttons) {
    var chatServer = this;
    return _(buttons)
      .chain()
      .filter(function(button) {
        return button.type === 'postback' || button.type === 'dialog';
      })
      .map(function(button) {
        var name = button.value || button.label;
        if (!_.isEmpty(button.answer)) {
          chatServer.setButtonFeedback(name, button.answer);
        }
        // if the button is dialog, then prefix the "dialog_" to trigger a dialog message
        var value = button.value || button.label;
        if (button.type === 'dialog') {
          value = 'dialog_' + value;
        }
        return {
          name: name,
          text: button.label || button.value,
          value: value,
          type: 'button',
          style: !_.isEmpty(button.style) ? button.style : 'default'
        };
      })
      .value();
  },
  downloadUrl: function(url) {
    var node_options = this.getOptions();
    return new Promise(function(resolve, reject) {
      // In order to retried private files a valid OAuth token must be
      // provided on the Bearer Authorization.  The current slack code parses out
      // url_private_download into the url variable.
      if (!_.isEmpty(node_options.oauthToken)) {
        var options = {
          url: url,
          headers : {
            "Authorization": "Bearer " + node_options.oauthToken,
          }
        };
        request(options, function(error, response, body) {
          if (error) {
            reject('Unable to download file ' + url);
          } else {
            resolve(body);
          }
        });
      } else {
        console.log(lcd.error('The Slack bot configuration has no OAuth token.'));
        console.log(lcd.grey(
          'In order to upload binaries from the Slack client, a OAuth token must be provided, get the token in the'
          + '"OAuth & Permission" section in https://api.slack.com'
        ));
        reject('No OAuth Token configured. Check');
      }
    });
  },
  // eslint-disable-next-line max-params
  sendBuffer: function(chatId, buffer, filename, caption) {
    var options = this.getOptions();
    var client = options.client;

    filename = !_.isEmpty(filename) ? filename : _.uniqueId('tmp_file_');

    return client.files
      .upload({
        filename: filename,
        file: buffer,
        filetype: 'auto',
        title: caption,
        channels: chatId
      });
  },
  setButtonFeedback: function(name, message) {
    if (this._buttonFeedbacks == null) {
      this._buttonFeedbacks = {};
    }
    this._buttonFeedbacks[name] = message;
  },
  getButtonFeedback: function(name) {
    return this._buttonFeedbacks != null ? this._buttonFeedbacks[name] : null;
  },
  /**
   * @method parsePayload
   * Parse an incoming message after an interactive message
   * https://api.slack.com/interactive-messages#responding
   */
  parsePayload: function(message) {
    var obj = null;
    try {
      obj = JSON.parse(message.payload);
    } catch(e) {
      // do nothing
    }
    return obj;
  }
});

Slack.registerMessageType('action', 'Action', 'Send an action message (like typing, ...)');
Slack.registerMessageType('audio', 'Audio', 'Send an audio message');
Slack.registerMessageType('dialog', 'Dialog', 'Open a dialog form');
Slack.registerMessageType('document', 'Document', 'Send a document or generic file');
Slack.registerMessageType('inline-buttons', 'Inline buttons', 'Send a message with inline buttons');
Slack.registerMessageType('location', 'Location', 'Send a map location message');
Slack.registerMessageType('message', 'Message', 'Send a plain text message');
Slack.registerMessageType('photo', 'Photo', 'Send a photo message');
Slack.registerMessageType('video', 'Video', 'Send video message');
Slack.registerMessageType('response', 'Dialog Response', 'Dialog response received');

module.exports = Slack;
