var _ = require('underscore');
var validators = require('../helpers/validators');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var request = require('request').defaults({ encoding: null });
var utils = require('../../lib/helpers/utils');
var helpers = require('../../lib/helpers/regexps');
var when = utils.when;
var ChatLog = require('../chat-log');
var FileCache = require('../file-cache');
var ViberBot = require('viber-bot').Bot;
var path = require("path");
var TextMessage = require('viber-bot').Message.Text;
var UrlMessage = require('viber-bot').Message.Url;
var ContactMessage = require('viber-bot').Message.Contact;
var PictureMessage = require('viber-bot').Message.Picture;
var VideoMessage = require('viber-bot').Message.Video;
var LocationMessage = require('viber-bot').Message.Location;
var StickerMessage = require('viber-bot').Message.Sticker;
var RichMediaMessage = require('viber-bot').Message.RichMedia;
var KeyboardMessage = require('viber-bot').Message.Keyboard;
var FileMessage = require('viber-bot').Message.File;


/*
  API DOCS: https://developers.viber.com/docs/api/nodejs-bot-api/#sendMessage
 */

var Viber = new ChatExpress({
  inboundMessageEvent: 'message',
  transport: 'viber',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    //return payload.message_token;
    return payload.sender != null ? payload.sender.id : null;
  },
  userIdKey: function(payload) {
    return payload.sender != null ? payload.sender.id : null;
  },
  tsKey: function(payload) {
    return moment.unix(payload.timestamp);
  },
  type: function() {
    // todo remove this
  },
  language: function(payload) {
    return payload != null && payload.sender != null ? payload.sender.language : null;
  },
  onStop: function() {
    var cache = this.cache;
    return new Promise(function(resolve) {
      cache.destroy();
      resolve();
    });
  },
  onStart: function() {
    var options = this.getOptions();
    options.connector = new ViberBot({
      authToken: options.token,
      name: options.botname,
      avatar: null
    });
    this.cache = FileCache();
    return true;
  },
  onStarted: function() {
    var options = this.getOptions();
    var bot = options.connector;
    return new Promise(function(resolve, reject) {
      bot.setWebhook(options.webHook)
        .then(
          resolve,
          function(error) {
            reject(
              'Viber server is unable to reach web hook: ' + options.webHook + '\n' +
              'Check you internet connection, this address must be reachable outside your local network'
            );
          }
        )
    });
  },
  routes: {
    '/redbot/viber/files/:id': function(req, res) {
      var server = this;
      var cache = server.cache;

      if (cache.exists(req.params.id)) {
        if (req.method === 'GET') {
          var file = cache.get(req.params.id);
          cache.stats();
          cache.cleanup();
          res.contentType(file.contentType);
          res.end(file.buffer, 'binary');
        } else if (req.method === 'HEAD') {
          res.sendStatus(200);
        }
      } else {
        res.sendStatus(404);
      }
    },

    '/redbot/viber': function(req, res) {

      // console.log('-----');
      // console.log('originalUrl', req.originalUrl);
      // console.log('called middleware', req.body);
      // console.log('params', req.params);
      // console.log('-----');

      if (req.body.event === 'message') {
        this.receive(req.body);
      }
      // ack
      res.sendStatus(200);
    }

  }
});



Viber.mixin({
  downloadFile: function (url) {
    return new Promise(function (resolve, reject) {
      var options = {
        url: url
      };
      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }
});

// get plain text messages
Viber.in(function(message) {
  return new Promise(function(resolve, reject) {
    var chatContext = message.chat();
    var payload = message.originalMessage;
    if (payload.message != null && payload.message.type === 'text') {
      message.payload.content = payload.message.text;
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

// send text message
Viber.out('message', function(message) {
  var connector = message.client();
  var context = message.chat();
  var recipient = { id: message.payload.chatId };

  return new Promise(function (resolve, reject) {
    connector
      .sendMessage(recipient, new TextMessage(message.payload.content))
      .then(function(messageId) {
        return when(context.set('messageId', messageId));
      })
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });

});

// get picture
Viber.in(function(message) {
  var server = this;
  return new Promise(function(resolve, reject) {
    var payload = message.originalMessage;
    if (payload.message != null && payload.message.type === 'picture') {
      server.downloadFile(payload.message.media)
        .then(
          function(buffer) {
            message.payload.content = buffer;
            message.payload.type = 'photo';
            resolve(message);
          },
          function(error) {
            reject(error);
          });
    } else {
      resolve(message);
    }
  });
});

// get document
Viber.in(function(message) {
  var server = this;
  return new Promise(function(resolve, reject) {
    var payload = message.originalMessage;
    if (payload.message != null && payload.message.type === 'file') {
      server.downloadFile(payload.message.media)
        .then(
          function(buffer) {
            message.payload.content = buffer;
            message.payload.type = 'document';
            resolve(message);
          },
          function(error) {
            reject(error);
          });
    } else {
      resolve(message);
    }
  });
});


// send document
Viber.out('document', function(message) {

  var cache = this.cache;
  var connector = message.client();
  var context = message.chat();
  var options = this.getOptions();

  return new Promise(function (resolve, reject) {
    var webHook = options.webHook;
    var recipient = { id: message.payload.chatId };

    // create a unique id and store in the cache to be retrieved via URL using ndoe-red
    var fileId = _.uniqueId('document_');
    // viber doesn't dowload files, only when the user clicks on the link, so retain in memory for a while
    // then remove after use
    cache.store(fileId, message.payload.content, {
      contentType: message.payload.mimeType,
      expiresIn: 10,
      removeAfterUse: true
    });
    var fileBackUrl = webHook + '/files/' + fileId;
    var file = new FileMessage(fileBackUrl, message.payload.content.byteLength, message.payload.filename);

    connector
      .sendMessage(recipient, file)
      .then(function(messageId) {
        return when(context.set('messageId', messageId));
      })
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });

});


// send photo
Viber.out('photo', function(message) {
  var cache = this.cache;
  var connector = message.client();
  var context = message.chat();
  var options = this.getOptions();

  return new Promise(function (resolve, reject) {
    var webHook = options.webHook;
    var recipient = { id: message.payload.chatId };

    // check if buffer
    if (!message.payload.content instanceof Buffer) {
      reject('Content is not a Buffer');
      return;
    }
    // check if size is less than 1Mb
    if (message.payload.content.byteLength > 1024*1024) {
      reject('Viber only supports .JPG images less than 1 Mb');
      return;
    }
    // get extension
    var fileExtension = null;
    if (message.payload.filename != null) {
      fileExtension = path.extname(message.payload.filename).toLowerCase();
    }
    // check extention
    if (fileExtension != null && fileExtension !== '.jpg' && fileExtension !== '.jpeg') {
      reject('Viber only supports images in JPG format');
      return;
    }
    // create a unique id and store in the cache to be retrieved via URL using ndoe-red
    var fileId = _.uniqueId('image_');
    cache.store(fileId, message.payload.content, {
      contentType: 'image/jpeg'
    });
    var pictureBackUrl = webHook + '/files/' + fileId;
    // build viber message
    var image = new PictureMessage(pictureBackUrl, message.payload.caption);

    connector
      .sendMessage(recipient, image)
      .then(function(messageId) {
        return when(context.set('messageId', messageId));
      })
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });

});

Viber.out('inline-buttons', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  var context = message.chat();
  var buttons = message.payload.buttons;

  // API docs: https://developers.viber.com/docs/all/#buttons-parameters

  // get the size of the buttons for each row, maximum 3 buttons for row
  // the viber grid is 6 colums, per RedBot design a button has a minimum of 2 columns
  // so maximum 3 buttons per row, buttons that exceeds are wrapped in a new row
  var columnSizePerRow = [];
  var currentButtons = 0;
  buttons.forEach(function(button, idx) {
    var isLast = idx === (buttons.length - 1);
    if (button.type === 'newline' || currentButtons === 3) {
      columnSizePerRow.push(6 / currentButtons);
      currentButtons = 0;
    } else if (isLast) {
      currentButtons += 1;
      columnSizePerRow.push(6 / currentButtons);
      currentButtons = 0;
    } else {
      currentButtons += 1;
    }
  });
  var rowsNumber = columnSizePerRow.length;

  // build the list fo translated buttons
  var rowIndex = 0;
  var currentRowSize = 0;
  var translatedButtons = [];
  buttons.forEach(function(button) {
    var obj = null;
    switch (button.type) {
      case 'url':
        obj = {
          ActionBody: button.url,
          ActionType: 'open-url',
          BgColor: '#ffffff',
          Text: button.label,
          Rows: 1,
          Columns: columnSizePerRow[rowIndex]
        };
        currentRowSize += columnSizePerRow[rowIndex];
        break;
      case 'postback':
        obj = {
          ActionBody: button.value,
          ActionType: 'reply',
          BgColor: '#ffffff',
          Text: button.label,
          Rows: 1,
          Columns: columnSizePerRow[rowIndex]
        };
        currentRowSize += columnSizePerRow[rowIndex];
        break;
      case 'newline':
        currentRowSize = 0;
        rowIndex += 1;
        break;
    }

    translatedButtons.push(obj);
    if (currentRowSize >= 6) {
      currentRowSize = 0;
      rowIndex += 1;
    }
  });

  // create message type
  var richMedia = new RichMediaMessage({
    ButtonsGroupColumns: 6,
    ButtonsGroupRows: rowsNumber,
    BgColor: '#FFFFFF',
    Buttons: translatedButtons
  });
  var recipient = { id: message.payload.chatId };

  return new Promise(function (resolve, reject) {
    connector
      .sendMessage(recipient, richMedia)
      .then(function (messageId) {
        return when(context.set('messageId', messageId));
      })
      .then(function () {
        resolve(message);
      }, function (error) {
        reject(error);
      });
  });
});

Viber.out('location', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  var context = message.chat();
  var recipient = { id: message.payload.chatId };
  var location = new LocationMessage(message.payload.content.latitude, message.payload.content.longitude);

  return new Promise(function (resolve, reject) {
    connector
      .sendMessage(recipient, location)
      .then(function(messageId) {
        return when(context.set('messageId', messageId));
      })
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });
});

module.exports = Viber;
