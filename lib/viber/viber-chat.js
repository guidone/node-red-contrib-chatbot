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
var TextMessage = require('viber-bot').Message.Text;
var UrlMessage = require('viber-bot').Message.Url;
var ContactMessage = require('viber-bot').Message.Contact;
var PictureMessage = require('viber-bot').Message.Picture;
var VideoMessage = require('viber-bot').Message.Video;
var LocationMessage = require('viber-bot').Message.Location;
var StickerMessage = require('viber-bot').Message.Sticker;
var RichMediaMessage = require('viber-bot').Message.RichMedia;
var KeyboardMessage = require('viber-bot').Message.Keyboard;


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
    console.log('start viber.....', options.token);
    options.connector = new ViberBot({
      authToken: options.token,
      name: "EchoBot", // todo name
      avatar: "http://viber.com/avatar.jpg" // It is recommended to be 720x720, and no more than 100kb.
    });
    this.cache = FileCache();
    return true;
  },
  onStarted: function() {

    var options = this.getOptions();
    var bot = options.connector;
    bot.setWebhook(options.webHook);
    return true;

  },
  routes: {
    '/redbot/viber/files/:id': function(req, res) {
      var server = this;
      var cache = server.cache;
      var file = cache.get(req.params.id);

      /*console.log('++++++ Images');
      console.log('originalUrl', req.originalUrl);
      console.log('method', req.method);
      console.log('Calling ---- ', req.params.id);*/

      if (file != null) {
        if (req.method === 'GET') {
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

  },
  events: {
    //message: function(botMsg) {
      //botMsg.inlineQueryId = botMsg.id;
      //delete botMsg.id;
      //this.receive(botMsg);
    //}
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

Viber.out('photo', function(message) {
  var cache = this.cache;
  var connector = message.client();
  var context = message.chat();
  var options = this.getOptions();

  return new Promise(function (resolve, reject) {

    var webHook = options.webHook;
    var recipient = { id: message.payload.chatId };
    // todo block > 1mb, not jpg

    var fileId = _.uniqueId('image_');
    cache.store(fileId, message.payload.content, {
      contentType: 'image/jpeg'
    });
    var pictureBackUrl = webHook + '/files/' + fileId;


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

  /*
  API docs: https://developers.viber.com/docs/all/#buttons-parameters
  */

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

module.exports = Viber;
