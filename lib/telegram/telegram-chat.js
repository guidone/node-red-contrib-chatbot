var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var fs = require('fs');
var os = require('os');
var TelegramBot = require('node-telegram-bot-api');
var request = require('request').defaults({ encoding: null });
var ChatLog = require('../chat-log');
var utils = require('../../lib/helpers/utils');
var when = utils.when;


var Telegram = new ChatExpress({
  inboundMessageEvent: 'message',
  transport: 'telegram',
  chatIdKey: function(payload) {
    return payload.chat.id;
  },
  userIdKey: function(payload) {
    return payload.from.username;
  },
  tsKey: function(payload) {
    return moment.unix(payload.date);
  },
  type: function(payload) {
    /*if (_.isString(payload.text)) {
      return 'message';
    } else if (payload.photo != null) {
      return 'photo';
    } else if (payload.voice != null) {
      return 'audio';
    } else if (payload.document != null) {
      return 'document';
    } else if (payload.sticker != null) {
      return 'sticker';
    } else if (payload.video != null) {
      return 'video';
    } else if (payload.location != null) {
      return 'location';
    } else if (payload.contact != null) {
      return 'location';
    }*/
  },
  onStop: function() {
    var options = this.getOptions();
    return options.connector.stopPolling();
  },
  onStart: function() {
    var options = this.getOptions();
    options.connector = new TelegramBot(options.token, {
      polling: {
        params: {
          timeout: 10
        },
        interval: !isNaN(parseInt(options.polling, 10)) ? parseInt(options.polling, 10) : 1000
      }
    });
    options.connector.setMaxListeners(0);
    return true;
  },
  debug: true
});

Telegram.in(function(message) {
  return new Promise(function(resolve, reject) {
    var chatContext = message.chat();
    if (_.isString(message.originalMessage.text) && !_.isEmpty(message.originalMessage.text)) {
      message.payload.content = message.originalMessage.text;
      message.payload.type = 'message';
      when(chatContext.set('message', message.payload.content))
        .then(function () {
          resolve(message);
        }, function (error) {
          reject(error);
        });
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    if (botMsg.location != null) {
      message.payload.content = botMsg.location;
      message.payload.type = 'location';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    if (botMsg.contact != null) {
      message.payload.content = botMsg.contact;
      message.payload.type = 'contact';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var connector = this.getOptions().connector;
  var botMsg = message.originalMessage;
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    var type = null;
    var fileId = null;
    // download one of these binary types
    if (botMsg.photo != null) {
      type = 'photo';
      fileId = _(botMsg.photo).last().file_id;
    } else if (botMsg.video != null) {
      type = 'video';
      fileId = botMsg.video.file_id;
    } else if (botMsg.voice != null) {
      type = 'audio';
      fileId = botMsg.voice.file_id;
    } if (botMsg.document != null) {
      type = 'document';
      fileId = botMsg.document.file_id;
    }
    // if not one of these pass thru
    if (type != null) {
      message.payload.type = type;
      connector.getFileLink(fileId)
        .then(function(path) {
          return chatServer.downloadFile(path);
        })
        .then(
          function(buffer) {
            message.payload.content = buffer;
            message.payload.caption = botMsg.caption;
            resolve(message);
          },
          function() {
            reject('Error downloading photo');
          });
    } else {
      resolve(message);
    }
  });
});

Telegram.out('photo', function(message) {
  var connector = this.getOptions().connector;
  return new Promise(function(resolve, reject) {
    connector.sendPhoto(message.payload.chatId, message.payload.content, {
      caption: message.payload.caption
    }).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });
  });
});

Telegram.out('video', function(message) {
  var connector = this.getOptions().connector;
  return new Promise(function(resolve, reject) {
    connector.sendVideo(message.payload.chatId, message.payload.content, {
      caption: message.payload.caption
    }).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });
  });
});

Telegram.out('audio', function(message) {
  var connector = this.getOptions().connector;
  return new Promise(function(resolve, reject) {
    connector.sendVoice(message.payload.chatId, message.payload.content, {
      caption: message.payload.caption
    }).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });
  });
});

Telegram.out('buttons', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  var parseMode = options.parseMode != null ? options.parseMode : null;
  return new Promise(function(resolve, reject) {
    if (_.isEmpty(message.payload.content)) {
      reject('Buttons node needs a non-empty message');
      return;
    }
    var buttons = {
      reply_markup: JSON.stringify({
        keyboard: _(message.payload.buttons).map(function(button) {
          return [button.value];
        }),
        resize_keyboard: true,
        one_time_keyboard: true
      }),
      parse_mode: parseMode
    };
    // finally send
    connector.sendMessage(
      message.payload.chatId,
      message.payload.content,
      buttons
    ).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });
  });
});

Telegram.mixin({
  downloadFile: function(url, token) {
    return new Promise(function(resolve, reject) {
      var options = {
        url: url,
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };
      request(options, function(error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }
});

module.exports = Telegram;
