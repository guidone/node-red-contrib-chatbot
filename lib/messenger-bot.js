'use strict';
const url = require('url')
const qs = require('querystring')
const EventEmitter = require('events').EventEmitter
const request = require('request')
const crypto = require('crypto')

var _ = require('underscore');
var _s = require("underscore.string");

class Bot extends EventEmitter {
  constructor (opts) {
    super();

    opts = opts || {}
    if (!opts.token) {
      throw new Error('Missing page token. See FB documentation for details: https://developers.facebook.com/docs/messenger-platform/quickstart')
    }
    this.token = opts.token;
    this.app_secret = opts.app_secret || false;
    this.verify_token = opts.verify || false;
  }


  getProfile (id, cb) {
    if (!cb) cb = Function.prototype

    request({
      method: 'GET',
      uri: `https://graph.facebook.com/v2.6/${id}`,
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
  }

  sendMessage (recipient, payload, cb) {
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
  }

  expressMiddleware(express) {

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
        var originalBody = _s.trim(JSON.stringify(req.body, null, 0));
        hmac.update(originalBody);

        var signature = 'sha1=' + hmac.digest('hex');

        console.log('che hmac', signature)
        console.log('header', req.headers['x-hub-signature']);
        console.log('uguali', signature === req.headers['x-hub-signature']);
        if (req.headers['x-hub-signature'] !== signature) {
          bot.emit('error', new Error('Message integrity check failed'))
          return res.send({status: 'not ok', error: 'Message integrity check failed'});
          }
      }
      // send the message through
      bot._handleMessage(req.body);
      res.send({status: 'ok'});
    });

  }

  /*middleware () {
    return (req, res) => {
      // we always write 200, otherwise facebook will keep retrying the request
      res.writeHead(200, { 'Content-Type': 'application/json' })
      if (req.url === '/_status') return res.end(JSON.stringify({status: 'ok'}))
      if (this.verify_token && req.method === 'GET') return this._verify(req, res)
      if (req.method !== 'POST') return res.end()

      var body = '';

      req.on('data', function(chunk) {
        body += chunk;
      });

      req.on('end', function() {
        // check message integrity
        if (this.app_secret) {
        let hmac = crypto.createHmac('sha1', this.app_secret)
        hmac.update(body)

        if (req.headers['x-hub-signature'] !== `sha1=${hmac.digest('hex')}`) {
          this.emit('error', new Error('Message integrity check failed'))
          return res.end(JSON.stringify({status: 'not ok', error: 'Message integrity check failed'}))
        }
      }

      let parsed = JSON.parse(body)
      this._handleMessage(parsed)

      res.end(JSON.stringify({status: 'ok'}))
    })
    }
  }*/

  _handleMessage (json) {
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
  }

  _verify (req, res) {
    let query = qs.parse(url.parse(req.url).query)

    if (query['hub.verify_token'] === this.verify_token) {
      return res.end(query['hub.challenge'])
    }

    return res.end('Error, wrong validation token')
  }

  _handleEvent (type, event) {
    this.emit(type, event, this.sendMessage.bind(this, event.sender.id))
  }
}

module.exports = Bot;
