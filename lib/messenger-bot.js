var url = require('url');
var inherits = require('util').inherits;
var qs = require('querystring');
var EventEmitter = require('events').EventEmitter;
var request = require('request')
var crypto = require('crypto');
var _ = require('underscore');
var _s = require("underscore.string");


function Bot(opts) {
  opts = opts || {};
  if (!opts.token) {
    throw new Error('Missing page token. See FB documentation for details: https://developers.facebook.com/docs/messenger-platform/quickstart')
  }
  this.token = opts.token;
  this.app_secret = opts.app_secret || false;
  this.verify_token = opts.verify || false;
  EventEmitter.call(this);
}

inherits(Bot, EventEmitter);

_.extend(Bot.prototype, {

  getProfile: function(id, cb) {
    if (!cb) {
      cb = Function.prototype;
    }

    request({
      method: 'GET',
      uri: 'https://graph.facebook.com/v2.6/' + id,
      qs: {
        fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
        access_token: this.token
      },
      json: true
    }, function(err, res, body) {
      if (err) {
        return cb(err);
      }
      if (body.error) {
        return cb(body.error);
      }
      cb(null, body)
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
        recipient: { id: recipient },
        message: payload
      }
    }, function(err, res, body) {
      if (err) {
        return cb(err)
      }
      if (body.error) {
        return cb(body.error)
      }
      cb(null, body)
    });
  },

  expressMiddleware: function(express) {

    var bot = this;

    express.get('/redbot/facebook/_status', function(req, res) {
      res.send({status: 'ok'});
    });

    express.get('/redbot/facebook', function(req, res) {
      bot._verify(req, res)
    });

    express.post('/redbot/facebook', function(req, res) {
      if (bot.app_secret) {
        var hmac = crypto.createHmac('sha1', bot.app_secret);
        // I think is demential to remove the rawBody from the request, if FB changes the way it serializes the
        // payload, this will break
        var originalBody = _s.trim(JSON.stringify(req.body, null, 0));
        hmac.update(originalBody);
        var signature = 'sha1=' + hmac.digest('hex');
        if (req.headers['x-hub-signature'] !== signature) {
          bot.emit('error', new Error('Message integrity check failed'));
          return res.send({status: 'not ok', error: 'Message integrity check failed'});
        }
      }
      // send the message through
      bot._handleMessage(req.body);
      res.send({status: 'ok'});
    });

  },

  _handleMessage: function(json) {
    var _this = this;
    var entries = json.entry;

    entries.forEach(function(entry) {
      var events = entry.messaging;

      events.forEach(function(event) {
        // handle inbound messages
        if (event.message) {
          _this._handleEvent('message', event)
        }
        // handle postbacks
        if (event.postback) {
          _this._handleEvent('postback', event)
        }
        // handle message delivered
        if (event.delivery) {
          _this._handleEvent('delivery', event)
        }
        // handle authentication
        if (event.optin) {
          _this._handleEvent('authentication', event)
        }
      });
    });
  },

  _verify: function(req, res) {
    var query = qs.parse(url.parse(req.url).query)

    if (query['hub.verify_token'] === this.verify_token) {
      return res.end(query['hub.challenge'])
    }

    return res.end('Error, wrong validation token')
  },

  _handleEvent: function(type, event) {
    this.emit(type, event, this.sendMessage.bind(this, event.sender.id))
  }


});

module.exports = Bot;
