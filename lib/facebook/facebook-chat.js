var _ = require('underscore');
var validators = require('../helpers/validators');
var qs = require('querystring');
var url = require('url');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var prettyjson = require('prettyjson');
var os = require('os');
var fs = require('fs');

var request = require('request').defaults({ encoding: null });
var utils = require('../../lib/helpers/utils');
var when = utils.when;

var Facebook = new ChatExpress({
  //inboundMessageEvent: 'message',
  transport: 'facebook',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
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
  onStop: function() {
    var options = this.getOptions();
    return true;
  },
  onStart: function() {
    var options = this.getOptions();
    console.log('partito il facebook');
    /*options.connector = new TelegramBot(options.token, {
      polling: {
        params: {
          timeout: 10
        },
        interval: !isNaN(parseInt(options.polling, 10)) ? parseInt(options.polling, 10) : 1000
      }
    });
    options.connector.setMaxListeners(0);*/
    return true;
  },
  events: {
    /*inline_query: function(botMsg) {

      this.receive(botMsg);
    }*/

  },
  routes: {
    '/redbot/facebook/test': function(req, res) {
      res.send('ok');
    },
    '/redbot/facebook': function(req, res) {
      var chatServer = this;
      if (req.method === 'GET') {
        // it's authentication challenge
        this.sendVerificationChallenge(req, res);
      } else if (req.method === 'POST') {
        var json = req.body;
        //console.log('>>>>');
        //console.log(prettyjson.render(req.body));
        if (json != null && _.isArray(json.entry)) {
          var entries = json.entry;
          entries.forEach(function (entry) {
            var events = entry.messaging;
            events.forEach(function (event) {
              // handle inbound messages
              if (event.message) {
                //_this.emit('message', event);
                //chatServer.handleMessage(event.message);
                chatServer.receive(event);
              }
              // handle postbacks
              if (event.postback) {
                event.message = {
                  text: event.postback.payload
                };
                delete event.postback;
                _this.emit('postback', event);
              }
              // handle message delivered
              if (event.delivery) {
                _this.emit('delivery', event);
              }
              // handle authentication
              if (event.optin) {
                _this.emit('authentication', event);
              }
              // handle account linking
              if (event.account_linking) {
                _this.emit('account_linking', event);
              }
            });
          });
          res.send({status: 'ok'});
        }


      }

      //bot._handleMessage(req.body);
      //



    }
  },
  routesDescription: {
    '/redbot/facebook': '',
    '/redbot/facebook/test': 'Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"'
  },
  debug: true
});

// get plain text messages
Facebook.in(function(message) {
  return new Promise(function(resolve, reject) {
    var chatContext = message.chat();
    if (_.isString(message.originalMessage.message.text) && !_.isEmpty(message.originalMessage.message.text)) {
      message.payload.content = message.originalMessage.message.text;
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

Facebook.out('message', function(message) {
  var chatServer = this;
  var options = this.getOptions();
  var connector = message.client();
  var context = message.chat();

  return new Promise(function (resolve, reject) {
    var task = null;
    /*if (message.originalMessage.modifyMessageId != null) {
      task = connector.editMessageText(message.payload.content, {
        chat_id: message.payload.chatId,
        message_id: message.originalMessage.modifyMessageId
      });
    } else {
      task = connector.sendMessage(message.payload.chatId, message.payload.content, { parse_mode: parseMode });
    }*/
    task = chatServer.sendMessage(message.payload.chatId, {
      text: message.payload.content
    });

    task
      .then(function(result) {
        return when(context.set('messageId', result.message_id))
      })
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });
});

Facebook.out('photo', function(message) {
  var chatServer = this;
  var options = this.getOptions();
  return new Promise(function(resolve, reject) {
    var image = message.payload.content;
    chatServer.uploadBuffer({
      recipient: message.payload.chatId,
      type: 'image',
      buffer: image,
      token: options.token,
      filename: message.payload.filename
    }).then(function() {
      resolve(message);
    },function(err) {
      reject(err);
    });
  });
});



Facebook.mixin({

  sendVerificationChallenge: function(req, res) {
    var options = this.getOptions();

    var query = qs.parse(url.parse(req.url).query);
    // eslint-disable-next-line no-console
    console.log('Verifying Facebook Messenger token "' + query['hub.verify_token'] + '", should be "'
      + options.verifyToken + '"');
    if (query['hub.verify_token'] === options.verifyToken) {
      // eslint-disable-next-line no-console
      console.log('Token verified.');
      return res.end(query['hub.challenge']);
    }
    return res.end('Error, wrong validation token');
  },

  handleMessage: function(message) {

    console.log('message', message);
  },

  sendMessage: function(recipient, payload) {
    var options = this.getOptions();
    return new Promise(function(resolve, reject) {
      request({
        method: 'POST',
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
          access_token: options.token
        },
        json: {
          messaging_type: 'RESPONSE',
          recipient: {
            id: recipient
          },
          message: payload
        }
      }, function(err, res, body) {
        if (err) {
          return reject(err)
        } else if ((body != null) && (_.isString(body))) {
          // body in string in case of error
          var errorJSON = null;
          try {
            errorJSON = JSON.parse(body);
          } catch(e) {
            errorJSON = {error: 'Error parsing error payload from Facebook.'};
          }
          return reject(errorJSON.error);
        } else if (body != null && body.error != null) {
          return reject(body.error.message);
        }
        return resolve(body)
      });
    });

  },

  uploadBuffer: function(params) {
    return new Promise(function(resolve, reject) {
      params = _.extend({
        recipient: null,
        filename: 'tmp-file',
        token: null,
        buffer: null,
        type: 'image',
        mimeType: 'application/octet-stream'
      }, params);

      var tmpFile = os.tmpdir() + '/' + params.filename;

      // write to filesystem to use stream
      fs.writeFile(tmpFile, params.buffer, function(err) {
        if (err) {
          reject(err);
        } else {
          // prepare payload
          var filedata = null;
          switch(params.type) {
            case 'image':
              filedata = {
                value: fs.createReadStream(tmpFile),
                options: {
                  filename: params.filename,
                  contentType: 'image/png' // fix extension
                }
              };
              break;
            case 'audio':
              filedata = {
                value: fs.createReadStream(tmpFile),
                options: {
                  filename: params.filename,
                  contentType: 'audio/mp3'
                }
              };
              break;
            case 'video':
              filedata = {
                value: fs.createReadStream(tmpFile),
                options: {
                  filename: params.filename,
                  contentType: params.mimeType
                }
              };
              break;
            case 'file':
              filedata = {
                value: fs.createReadStream(tmpFile),
                options: {
                  filename: params.filename,
                  contentType: params.mimeType
                }
              };
          }
          // upload and send
          var formData = {
            recipient: '{"id":"' + params.recipient +'"}',
            message: '{"attachment":{"type":"' + params.type + '", "payload":{}}}',
            filedata: filedata
          };
          request.post({
            url: 'https://graph.facebook.com/v2.6/me/messages?access_token=' + params.token,
            formData: formData
          }, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      }); // end writeFile
    });
  }


});


module.exports = Facebook;
