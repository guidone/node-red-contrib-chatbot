var _ = require('underscore');
var qs = require('querystring');
var url = require('url');
var moment = require('moment');
var { ChatExpress, ChatLog } = require('chat-platform');
var parseButtons = require('./parse-buttons');
var payloadTx = require('./payload-translators');

const request = require('request').defaults({ encoding: null });
const { when, params } = require('../../helpers/utils');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v15.0';

// set the messageId in a returning payload
const setMessageId = (message, messageId) => ({
  ...message,
  payload: {
    ...message.payload,
    messageId
  }
});

const Whatsapp = new ChatExpress({
  transport: 'whatsapp',
  transportDescription: 'Whatsapp',
  color: '#4267b2', // TODO fix color
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    return _.isArray(payload.contacts) && !_.isEmpty(payload.contacts) ? payload.contacts[0].wa_id : null;
  },
  messageIdKey: function(payload) {
    return payload.id; // TODO message id
    //return payload.message.mid;
  },
  userIdKey: function(payload) {
    return _.isArray(payload.contacts) && !_.isEmpty(payload.contacts) ? payload.contacts[0].wa_id : null;
  },
  tsKey: function(payload) {
    return moment.unix(payload.timestamp / 1000).toISOString();
  },
  type: function(payload) {
    // todo remove this
    return payload.type;
  },
  onStart: function() {
    this._profiles = {};
    return true;
  },
  events: {},
  multiWebHook: true,
  webHookScheme: function() {
    const { token } = this.getOptions();
    return token != null ? token.substr(0,10) : null;
  },
  routes: {
    '/redbot/whatsapp/test': function(req, res) {
      res.send('ok');
    },
    '/redbot/whatsapp': function(req, res) {
      const chatServer = this;

      if (req.method === 'GET') {
        // it's authentication challenge
        this.sendVerificationChallenge(req, res);
      } else if (req.method === 'POST') {
        var json = req.body;

        // docs for entry messages
        // https://developers.facebook.com/docs/messenger-platform/reference/webhook-events
        // and
        // https://developers.facebook.com/docs/graph-api/webhooks/getting-started
        if (json != null && _.isArray(json.entry)) {
          // send ok to Whatsapp server
          res.send({status: 'ok'});

          json.entry.forEach(entry => {
            if (_.isArray(entry.changes)) {
              entry.changes.forEach(change => {
                if (change?.field === 'messages' && _.isArray(change?.value.messages)) {
                  change?.value.messages.forEach(message => {
                    // TODO remove
                    console.log('processi message', {
                      ...message,
                      contacts: change.value.contacts,
                      ...change.value.metadata
                    });
                    chatServer.receive({
                      ...message,
                      contacts: change.value.contacts,
                      ...change.value.metadata
                    });
                  });
                }
              });
            }
          });
        }
      }
    }
  },
  routesDescription: {
    '/redbot/whatsapp': 'Use this in the "Webhooks" section of the Facebook App ("Edit Subscription" button)',
    '/redbot/whatsapp/test': 'Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"'
  }
});

Whatsapp.mixin({

  sendVerificationChallenge: function(req, res) {
    var options = this.getOptions();

    var query = qs.parse(url.parse(req.url).query);
    // eslint-disable-next-line no-console
    console.log('Verifying Whatsapp token "' + query['hub.verify_token'] + '", should be "'
      + options.verifyToken + '"');
    // eslint-disable-next-line no-console
    console.log('Token verified.');
    return res.end(query['hub.challenge']);
  },

  post: function(endpoint, json) {
    // TODO parametrize this
    // TODO switch from deprecated request
    const options = this.getOptions();

    console.log('options',options.token)
    console.log('options',options.)
    return new Promise(function(resolve, reject) {
      request({
        method: 'POST',
        uri: `${WHATSAPP_API_URL}/105780172312222/${endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.token}`
        },
        json
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
        // extract message id if any
        if (_.isArray(body.messages) && _.isEmpty(body.messages)) {
          body.messageId = body.messages[0].id;
        }
        return resolve(body)
      });
    });



  }


});

Whatsapp.in(function(message) {
  console.log('processo---', message)
  return new Promise(function(resolve) {
    if (message.originalMessage.type === 'text') {
      message.payload.content = message.originalMessage.text.body;
      message.payload.type = 'message';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Whatsapp.out('message', async function(message) {
  const chatServer = this;
  const context = message.chat();

  console.log('sending message--->', message)
  const response = await chatServer
    .post('messages', {
      messaging_product: 'whatsapp',
      to: message.payload.chatId,
      type: 'text',
      text: {
        body: message.payload.content
      }
    });

  await when(context.set({
    messageId: response.message_id,
    outboundMessageId: response.message_id
  }));

  console.log('response', response)
  return setMessageId(message, response.messageId);
});


Whatsapp.registerMessageType('message', 'Message', 'Send a plain text message');


module.exports = Whatsapp;
