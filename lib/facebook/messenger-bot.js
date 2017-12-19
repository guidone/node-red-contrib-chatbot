var url = require('url');
var inherits = require('util').inherits;
var qs = require('querystring');
var EventEmitter = require('events').EventEmitter;
var request = require('request');
//var crypto = require('crypto');
var _ = require('underscore');
//var _s = require("underscore.string");


function Bot(opts) {
  opts = opts || {};
  if (!opts.token) {
    throw new Error('Missing page token. See FB documentation for details: https://developers.facebook.com/docs/messenger-platform/quickstart')
  }
  this.token = opts.token;
  this.app_secret = opts.app_secret || false;
  this.verify_token = opts.verify || 'token';
  EventEmitter.call(this);
}

inherits(Bot, EventEmitter);

_.extend(Bot.prototype, {

  getProfile: function(id) {
    var token = this.token;
    return new Promise(function(resolve, reject) {
      request({
        method: 'GET',
        uri: 'https://graph.facebook.com/v2.6/' + id,
        qs: {
          fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
          access_token: token
        },
        json: true
      }, function(err, res, body) {
        if (err) {
          reject(err);
        } else if (body.error) {
          reject(body.error);
        } else {
          resolve(body);
        }
      });
    });
  },

  removePersistentMenu: function(cb) {
    request({
      method: 'DELETE',
      uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
      qs: {
        access_token: this.token
      },
      json: {
        fields: ['persistent_menu']
      }
    }, function(err, res, body) {
      if (body != null && body.error != null) {
        return cb(body.error.message)
      }
      return cb(null);
    });
  },

  setPersistentMenu: function(items, composerInputDisabled, cb) {
    request({
      method: 'POST',
      uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
      qs: {
        access_token: this.token
      },
      json: {
        "persistent_menu": [
          {
            locale: 'default',
            composer_input_disabled: composerInputDisabled,
            call_to_actions: items
          }
        ]
      }
    }, function(err, res, body) {
      if (body != null && body.error != null) {
        return cb(body.error.message)
      }
      return cb(null);
    });
  },

  sendMessage: function(recipient, payload, cb) {
    if (!cb) {
      cb = Function.prototype;
    }
    request({
      method: 'POST',
      uri: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {
        access_token: this.token
      },
      json: {
        recipient: {
          id: recipient
        },
        message: payload
      }
    }, function(err, res, body) {
      if (err) {
        return cb(err)
      } else if ((body != null) && (_.isString(body))) {
        // body in string in case of error
        var errorJSON = null;
        try {
          errorJSON = JSON.parse(body);
        } catch(e) {
          errorJSON = {error: 'Error parsing error payload from Facebook.'};
        }
        return cb(errorJSON.error);
      } else if (body != null && body.error != null) {
        return cb(body.error.message);
      }
      return cb(null, body)
    });
  },

  expressMiddleware: function(express) {

    var bot = this;

    express.get('/redbot/facebook/test', function(req, res) {
      bot._handleMessage({
        object: 'page',
        entry: [
          {
            id: 'not-a-valid-id',
            time: 1489742285434,
            messaging: [
              {
                sender: { id: null },
                recipient: { id: null },
                timestamp: 1489742285434,
                message: {
                  mid: 'not-a-valid-message-id',
                  seq: 42,
                  text: 'This is a test message (will not work with a Facebook Sender node)'
                }
              }
            ]
          }
        ]
      });
      res.send({status: 'ok'});
    });

    express.get('/redbot/facebook/_status', function(req, res) {
      res.send({status: 'ok'});
    });

    express.get('/redbot/facebook', function(req, res) {
      bot._verify(req, res)
    });

    express.post('/redbot/facebook', function(req, res) {
      /*if (bot.app_secret) {
        var hmac = crypto.createHmac('sha1', bot.app_secret);
        // I think is demential to remove the rawBody from the request, if FB changes the way it serializes the
        // payload, this will break. The way the original body is rebuilt is uber-demential: since facebook encode
        // slash with \/ but not the stringify, then we need the replacer to do that, unfortunately passing '\/'
        // stringify encodes with '\\/'. This is the reason of the fixer and the useles tag like --slash--
        var originalBody = _s.trim(fixer(JSON.stringify(req.body, replacer, 0)));
        hmac.update(originalBody);
        //var signature = 'sha1=' + hmac.digest('hex');
        if (req.headers['x-hub-signature'] !== signature) {
          bot.emit('error', new Error('Message integrity check failed'));
          return res.send({status: 'not ok', error: 'Message integrity check failed'});
        }
      }*/
      // send the message through
      bot._handleMessage(req.body);
      res.send({status: 'ok'});
    });

  },

  _handleMessage: function(json) {
    var _this = this;
    // exit if empty body
    if (json != null && _.isArray(json.entry)) {
      var entries = json.entry;
      entries.forEach(function (entry) {
        var events = entry.messaging;
        events.forEach(function (event) {
          // handle inbound messages
          if (event.message) {
            _this.emit('message', event);
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
    }
  },

  _verify: function(req, res) {
    var query = qs.parse(url.parse(req.url).query);
    // eslint-disable-next-line no-console
    console.log('Verifying Facebook Messenger token "' + query['hub.verify_token'] + '", should be "' + this.verify_token + '"');
    if (query['hub.verify_token'] === this.verify_token) {
      // eslint-disable-next-line no-console
      console.log('Token verified.');
      return res.end(query['hub.challenge']);
    }
    return res.end('Error, wrong validation token');
  }

});

module.exports = Bot;
