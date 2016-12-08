var _ = require('underscore');
var SmoochCore = require('smooch-core');
var fs = require('fs');
var os = require('os');
var request = require('request').defaults({ encoding: null });
var https = require('https');
var http = require('http');

function SmoochBot(opts) {

  var options = _.extend({
    keyId: null,
    secret: null
  }, opts);

  var _events = {};

  // using app token
  var smoochCore = new SmoochCore({
    keyId: options.keyId,
    secret: options.secret,
    scope: 'app'
  });

  var api = {

    on: function(eventName, callback) {
      if (_events[eventName] == null) {
        _events[eventName] = [];
      }
      _events[eventName].push(callback);
    },

    emit: function(eventName, obj) {
      if (_events[eventName] != null) {
        _events[eventName].forEach(function(callback) {
          callback(obj);
        });
      }
    },

    sendMessage: function(chatId, text, handleError) {
      smoochCore.appUsers.sendMessage(chatId, {
        text: text,
        role: 'appMaker'
      }).then(function(result) {
        // do nothing
      }).catch(function(err) {
        handleError(err);
      });
    },

    sendActions: function(chatId, text, actions) {

      return smoochCore.appUsers.sendMessage(chatId, {
        text: text,
        actions: _(actions).map(function(action) {
          return {
            type: 'reply',
            text: action.label,
            payload: action.value
          };
        }),
        role: 'appMaker'
      });
    },


    uploadBuffer: function(chatId, buffer, params) {

      return new Promise(function(resolve, reject) {
        params = _.extend({
          recipient: null,
          filename: 'tmp-file',
          token: null,
          buffer: null,
          type: 'image'
        }, params);

        var tmpFile = os.tmpdir() + '/' + params.filename;

        // write to filesystem to use stream
        fs.writeFile(tmpFile, buffer, function(err) {
          if (err) {
            reject(err);
          } else {
            // prepare payload
            var filedata = null;
            var name = '';
            switch(params.type) {
              case 'image':
                name = 'image.mp3';
                filedata = {
                  value: fs.createReadStream(tmpFile),
                  options: {
                    filename: params.filename,
                    contentType: 'image/png' // fix extension
                  }
                };
                break;
              case 'audio':
                name = 'audio.mp3';
                filedata = {
                  value: fs.createReadStream(tmpFile),
                  options: {
                    filename: params.filename,
                    contentType: 'audio/mp3'
                  }
                };
                break;
            }
            // upload and send
            var formData = {
              role: 'appMaker',
              name: name,
              source: filedata
            };

            request.post({
              url: 'https://api.smooch.io/v1/appusers/' + chatId + '/images',
              headers: {
                'Authorization': smoochCore.authHeaders.Authorization,
                'Content-Type': 'application/json'
              },
              formData: formData
            }, function(err, response, body) {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          }
        }); // end writeFile
      });
    },

    addExpressMiddleware: function(express) {

      express.post('/redbot/smooch', function(req, res) {
        // todo should check for secret

        if (req.body.trigger === 'message:appUser') {
          req.body.messages.forEach(function(message) {
            api.emit('message', message);
          });
        } else if (req.body.trigger === 'postback') {
          req.body.postbacks.forEach(function(postback) {
            // mimic a message on receiving a postback
            api.emit('message', {
              text: postback.action.payload,
              role: 'appUser',
              received: postback.message.received,
              authorId: req.body.appUser._id,
              _id: postback.message._id,
              source: postback.message.source,
              items: [],
              actions: []
            })
          });
        }

        res.send({status: 'ok'});
      });

    },

    removeExpressMiddleware: function(express) {
      var endpoints = ['/redbot/smooch'];
      // remove middleware endpoints
      express._router.stack.forEach(function(route, i, routes) {
        if (route.route && _.contains(endpoints, route.route.path)) {
          routes.splice(i, 1);
        }
      });
    }


  };

  return api;

};

module.exports = SmoochBot;
