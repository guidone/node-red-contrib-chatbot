var _ = require('underscore');
var qs = require('querystring');
var url = require('url');
var moment = require('moment');
var { ChatExpress, ChatLog } = require('chat-platform');
var parseButtons = require('./parse-buttons');
var payloadTx = require('./payload-translators');
const fetch = require('node-fetch');
const fs = require('fs');

const documentExtensions = ['.pdf', '.png', '.jpg', '.zip', '.gif'];
const photoExtensions = ['.jpg', '.jpeg', '.png'];
const MAX_PHOTO_DIMENSIONS = 5 * 1024 * 1024;

const request = require('request').defaults({ encoding: null });
const { when, params } = require('../../helpers/utils');

const stream2buffer = function(stream) {
  return new Promise((resolve, reject) => {
    const _buf = [];
    stream.on('data', (chunk) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err) => reject(err));
  });
};

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
  //relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
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

  getMedia: async function(url) {
    const options = this.getOptions();
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'Content-Type': 'application/octet-stream'
      }
    });
    return await stream2buffer(res.body);
  },

  post: function(endpoint, json) {
    return this.call('POST', endpoint, json);
  },

  get: function(endpoint, json) {
    return this.call('GET', endpoint, json);
  },

  call: function(method, endpoint, json) {

    // TODO switch from deprecated request
    const options = this.getOptions();

    return new Promise(function(resolve, reject) {
      request({
        method: method,
        uri: `${WHATSAPP_API_URL}/${endpoint}`,
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
        if (body instanceof Buffer) {
          let response = null;
          try {
            response = JSON.parse(body.toString());
          } catch(e) {
            reject({ error: 'Error parsing JSON payload from Facebook.' });
          }
          resolve(response);
        } else {
          resolve(body);
        }
      });
    });
  },

  uploadBuffer: async function(params) {
    const options = this.getOptions();
    params = _.extend({
      mimeType: 'application/octet-stream'
    }, params);


    //return new Promise(function(resolve, reject) {
      /*params = _.extend({
        recipient: null,
        filename: 'tmp-file',
        token: null,
        buffer: null,
        type: 'image',
        mimeType: 'application/octet-stream'
      }, params);

      // prepare payload
      var filedata = null;
      switch(params.type) {
        case 'image':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename || 'image.png',
              contentType: 'image/png' // fix extension
            }
          };
          break;
        case 'audio':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename || 'audio.mp3',
              contentType: 'audio/mp3'
            }
          };
          break;
        case 'video':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename || 'video.mpg',
              contentType: params.mimeType
            }
          };
          break;
        case 'file':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename || 'file',
              contentType: params.mimeType
            }
          };
      }*/

    const formData = new FormData();
    formData.append(
      'file',
      params.buffer,
      {
        filename: params.filename,
        contentType: params.mimeType,
      }
    );
    formData.append('messaging_product', 'whatsapp');

    const response = await fetch(`${WHATSAPP_API_URL}/${options.phoneNumberId}/media`, {
      headers: {
        'Authorization': `Bearer ${options.token}`
      },
      method: 'POST',
      body: formData
    });

    const data = await response.json()
    console.log('res upload ---> ', data);
    return data;
  },


});

/*Whatsapp.in('text', function(message) {
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
});*/

Whatsapp.in('text', function(message) {
  message.payload.content = message.originalMessage.text.body;
  message.payload.type = 'message';
  if (message.originalMessage.context != null) {
    message.payload.replyTo = message.originalMessage.context.id;
  }
  return message;
});

Whatsapp.in('button', function(message) {
  message.payload.content = message.originalMessage.button.payload;
  message.payload.type = 'message';
  console.log('check', message.originalMessage, message.originalMessage.context != null)
  if (message.originalMessage.context != null) {
    message.payload.replyTo = message.originalMessage.context.id;
  }
  return message;
});

Whatsapp.in('image', async function(message) {
  const chatServer = this;

  try {
    const response = await chatServer.get(message.originalMessage.image.id);
    const image = await this.getMedia(response.url);
    message.payload.type = 'photo';
    message.payload.content = image;

    return message;
  } catch (e) {
    throw `Unable to process image ${message.originalMessage.image.id}`;
  }

});

Whatsapp.out('message', async function(message) {
  const chatServer = this;
  const options = this.getOptions();
  const context = message.chat();

  const response = await chatServer
    .post(`${options.phoneNumberId}/messages`, {
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

  return setMessageId(message, response.messageId);
});

Whatsapp.out('location', async function(message) {
  const context = message.chat();
  const chatServer = this;
  const options = this.getOptions();

  const response = await chatServer
    .post(`${options.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: message.payload.chatId,
      type: 'location',
      location: {
        longitude: message.payload.content.longitude,
        latitude: message.payload.content.latitude,
        name: message.payload.place
      }
    });

  await when(context.set({
    messageId: response.message_id,
    outboundMessageId: response.message_id
  }));

  return setMessageId(message, response.messageId);
});

Whatsapp.out('whatsapp-template', async function(message) {
  const context = message.chat();
  const chatServer = this;
  const options = this.getOptions();

  console.log('template to send', message.payload);

  // build params list
  const components = [];
  if (_.isArray(message.payload.paramsBody) && !_.isEmpty(message.payload.paramsBody)) {
    components.push({
      type: 'body',
      parameters: message.payload.paramsBody
    });
  }
  if (_.isArray(message.payload.paramsHeader) && !_.isEmpty(message.payload.paramsHeader)) {
    components.push({
      type: 'header',
      parameters: message.payload.paramsHeader
    });
  }


  const response = await chatServer
    .post(`${options.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: message.payload.chatId,
      type: 'template',
      template: {
        name: message.payload.template,
        language: {
          code: message.payload.language,
          policy: 'deterministic'
        },
        components
      }
    });

  await when(context.set({
    messageId: response.message_id,
    outboundMessageId: response.message_id
  }));

  return setMessageId(message, response.messageId);
});

Whatsapp.out('photo', async function(message) {
  const context = message.chat();
  const chatServer = this;
  const options = this.getOptions();

  // upload the photo
  const uploaded = await chatServer.uploadBuffer({
    buffer: message.payload.content,
    mimeType: message.payload.mimeType,
    filename: message.payload.filename
  });

  const response = await chatServer
    .post(`${options.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: message.payload.chatId,
      type: 'image',
      image: {
        id: uploaded.id,
        caption: message.payload.caption
      }
    });

  await when(context.set({
    messageId: response.message_id,
    outboundMessageId: response.message_id
  }));

  return setMessageId(message, response.messageId);
});

Whatsapp.registerMessageType('message', 'Message', 'Send a plain text message');
Whatsapp.registerMessageType('location', 'Location', 'Send a map location message');
Whatsapp.registerMessageType('whatsapp-template', 'Whatsapp Template', 'Send Whatsapp template with parameters');

Whatsapp.registerMessageType(
  'photo',
  'Photo',
  'Send a photo message',
  file => {
    if (!_.isEmpty(file.extension) && !photoExtensions.includes(file.extension)) {
      return `Unsupported file format for image node "${file.filename}", allowed formats: ${photoExtensions.join(', ')}`;
    }
    if (file.size != null && file.size > MAX_PHOTO_DIMENSIONS) {
      return `Excedeed size for image node "${file.filename}", max size: 5MB}`;
    }
  }
);

module.exports = Whatsapp;
