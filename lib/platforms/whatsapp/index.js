const _ = require('underscore');
const qs = require('querystring');
const url = require('url');
const moment = require('moment');
const { ChatExpress, ChatLog } = require('chat-platform');
const fetch = require('node-fetch');

const validators = require('../../helpers/validators');
const { when, params, getMessageId } = require('../../helpers/utils');
const fetchers = require('../../helpers/fetchers-obj');
const { log } = require('../../helpers/lcd');

const DOCUMENT_EXTENSIONS = ['.txt', '.doc', '.docx','.pdf', '.ppt','.pptx', '.xls', '.xlsx'];
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png'];
const AUDIO_EXTENSIONS = ['.aac', '.mp4', '.mpeg', '.amr', '.ogg', '.opus', '.mp3'];
const VIDEO_EXTENSIONS = ['.mp4', '.3gp'];
const MAX_PHOTO_DIMENSIONS = 5 * 1024 * 1024;
const WHATSAPP_API_URL = 'https://graph.facebook.com/v15.0';

const stream2buffer = function(stream) {
  return new Promise((resolve, reject) => {
    const _buf = [];
    stream.on('data', (chunk) => _buf.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(_buf)));
    stream.on('error', (err) => reject(err));
  });
};

/**
 * txButton
 * Translate a RedBot button into a interactive button (in Whatsapp)
 * @param {object} button
 * @returns {object}
 */
const txButton = function(button) {
  if (button.type === 'postback') {
    return {
      type: 'reply',
      reply: {
        title: button.label,
        id: !_.isEmpty(button.value) ? button.value : button.label
      }
    };
  }
  return undefined;
}

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
  color: '#73E468',
  chatIdKey: function(payload) {
    if (_.isArray(payload.contacts) && !_.isEmpty(payload.contacts)) {
      // in case of message
      return payload.contacts[0].wa_id;
    } else if (payload.recipient_id != null) {
      // this in case of an event
      return payload.recipient_id;
    }
    return null;
  },
  messageIdKey: function(payload) {
    return payload.id;
  },
  userIdKey: function(payload) {
    if (_.isArray(payload.contacts) && !_.isEmpty(payload.contacts)) {
      // in case of message
      return payload.contacts[0].wa_id;
    } else if (payload.recipient_id != null) {
      // this in case of an event
      return payload.recipient_id;
    }
    return null;
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
        const json = req.body;
        // docs for entry messages
        // https://developers.facebook.com/docs/messenger-platform/reference/webhook-events
        // and
        // https://developers.facebook.com/docs/graph-api/webhooks/getting-started
        if (json != null && _.isArray(json.entry)) {
          // cycle through messages
          json.entry.forEach(entry => {
            if (_.isArray(entry.changes)) {
              entry.changes.forEach(change => {
                if (change?.field === 'messages' && _.isArray(change?.value.statuses)) {
                  change?.value.statuses.forEach(status => {
                    // move some fields, those useful to determine chatId, userId, timestamp, messageId
                    // and eventType to first level
                    chatServer.receive({
                      type: 'event',
                      eventType: status.status,
                      recipient_id: status.recipient_id,
                      id: status.id,
                      timestamp: status.timestamp,
                      content: _.omit(status, ['recipient_id', 'id', 'timestamp', 'status'])
                    });
                  });
                } else if (change?.field === 'messages' && _.isArray(change?.value.messages)) {
                  change?.value.messages.forEach(message => {
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
        // send ok to Whatsapp server
        res.send({ status: 'OK' });
      }
    }
  },
  routesDescription: {
    '/redbot/whatsapp': 'Use this in the "Webhooks" section of the Facebook App ("Edit Subscription" button)',
    '/redbot/whatsapp/test': 'Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"'
  }
});

Whatsapp.mixin({

  sendMediaFactory: function(type, factoryOptions) {
    const chatServer = this;
    const opts = {
      caption: true,
      ...factoryOptions
    };

    return async function(message) {
      const context = message.chat();
      const options = chatServer.getOptions();
      const param = params(message);

      let waContext = undefined;
      if (param('replyToMessage', false)) {
        waContext = {
          message_id: getMessageId(message)
        };
      }

      // upload the media
      let uploaded;
      try {
        uploaded = await chatServer.uploadBuffer({
          buffer: message.payload.content,
          mimeType: message.payload.mimeType,
          filename: message.payload.filename
        });
      } catch(e) {
        throw `Unable to upload file: ${message.payload.filename} (${message.payload.mimeType})`;
      }
      if (uploaded.error) {
        throw uploaded.error.message;
      }

      const mediaObject = {
        id: uploaded.id
      };
      if (opts.caption) {
        mediaObject.caption = message.payload.caption;
      }

      const response = await chatServer
        .post(`${options.phoneNumberId}/messages`, {
          messaging_product: 'whatsapp',
          to: message.payload.chatId,
          type,
          context: waContext,
          [type]: mediaObject
        });

      await when(context.set({
        messageId: response.message_id,
        outboundMessageId: response.message_id
      }));

      return setMessageId(message, response.messageId);
    };
  },

  sendVerificationChallenge: function(req, res) {
    const options = this.getOptions();
    const query = qs.parse(url.parse(req.url).query);
    // eslint-disable-next-line no-console
    log('Verifying Whatsapp token "' + query['hub.verify_token'] + '", should be ' +
      (options.verifyToken ? '"' + options.verifyToken + '"' : 'anyhting'));
    // eslint-disable-next-line no-console
    log('Token verified.');
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

  call: async function(method, endpoint, json) {
    const options = this.getOptions();

    const res = await fetch(`${WHATSAPP_API_URL}/${endpoint}`, {
      method: method,
      headers: {
        'Authorization': `Bearer ${options.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json)
    });
    const result = await res.json();
    // check error
    if (result.error != null) {
      throw `WhatsAPI error: ${result.error.message}`;
    }
    // extract message id if any
    if (_.isArray(result.messages) && _.isEmpty(result.messages)) {
      result.messageId = result.messages[0].id;
    }

    return result;
  },

  uploadBuffer: async function(params) {
    const options = this.getOptions();
    params = _.extend({
      mimeType: 'application/octet-stream'
    }, params);

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

    return data;
  },

  /**
 * translateParameters
 * Translate video, document and image parameters, uploading them and replaceing with the media id
 * @param {*} parameters
 */
  translateParameters: async function(parameters) {
    const chatServer = this;
    if (_.isEmpty(parameters)) {
      return parameters;
    }
    let idx;
    const translated = [];

    for(idx = 0; idx < parameters.length; idx++) {
      // for image vide and document, if local file, upload with media api and use the id
      if (['image', 'video', 'document'].includes(parameters[idx].type)) {
        if (validators.url(parameters[idx].image)) {
          translated.push({
            type: parameters[idx].type,
            [parameters[idx].type]: {
              link: parameters[idx][parameters[idx].type]
            }
          });
        } else if (validators.filepath(parameters[idx][parameters[idx].type])) {
          try {
            const uploaded = await fetchers.file(parameters[idx][parameters[idx].type]);
            const media = await await chatServer.uploadBuffer({
              buffer: uploaded.buffer,
              mimeType: uploaded.mimeType,
              filename: uploaded.filename
            });
            translated.push({
              type: parameters[idx].type,
              [parameters[idx].type]: {
                id: media.id
              }
            });
          } catch (e) {
            throw `Unable to find media file: ${parameters[idx]['image']}`;
          }
        }
      } else {
        // if nothing applies, leave it unchanged
        translated.push(parameters[idx]);
      }
    }

    return translated;
  }
});

Whatsapp.in('event', function(message) {
  if (message.originalMessage.type != null) {
    message.payload.type = 'event';
    message.payload.eventType = message.originalMessage.eventType;
    message.payload.content = message.originalMessage.content;
    return message;
  }
  return message;
});

Whatsapp.in('text', function(message) {
  message.payload.content = message.originalMessage.text.body;
  message.payload.type = 'message';
  if (message.originalMessage.context != null) {
    message.payload.replyTo = message.originalMessage.context.id;
  }
  return message;
});

Whatsapp.in('location', function(message) {
  message.payload.type = 'location';
  message.payload.content = message.originalMessage.location;
  if (message.originalMessage.context != null) {
    message.payload.replyTo = message.originalMessage.context.id;
  }
  return message;
});

Whatsapp.in('button', function(message) {
  message.payload.content = message.originalMessage.button.payload;
  message.payload.type = 'message';
  if (message.originalMessage.context != null) {
    message.payload.replyTo = message.originalMessage.context.id;
  }
  return message;
});

Whatsapp.in('interactive', function(message) {
  message.payload.content = message.originalMessage.interactive?.button_reply?.id; // always not empty
  message.payload.type = 'message';
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
  const param = params(message);

  let waContext = undefined;
  if (param('replyToMessage', false)) {
    waContext = {
      message_id: getMessageId(message)
    };
  }

  const response = await chatServer
    .post(`${options.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: message.payload.chatId,
      type: 'text',
      context: waContext,
      text: {
        body: message.payload.content,
        preview_url: param('preview_url', false)
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

  // build params list
  const components = [];
  if (_.isArray(message.payload.paramsBody) && !_.isEmpty(message.payload.paramsBody)) {
    components.push({
      type: 'body',
      parameters: await chatServer.translateParameters(message.payload.paramsBody)
    });
  }
  if (_.isArray(message.payload.paramsHeader) && !_.isEmpty(message.payload.paramsHeader)) {
    components.push({
      type: 'header',
      parameters: await chatServer.translateParameters(message.payload.paramsHeader)
    });
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: message.payload.chatId,
    type: 'template',
    template: {
      name: message.payload.template,
      language: {
        code: message.payload.language
      },
      components: !_.isEmpty(components) ? components : undefined
    }
  };

  //log(payload)

  const response = await chatServer
    .post(`${options.phoneNumberId}/messages`, payload);

  await when(context.set({
    messageId: response.message_id,
    outboundMessageId: response.message_id
  }));

  return setMessageId(message, response.messageId);
});

Whatsapp.out('document', async function(message) {
  return this.sendMediaFactory('document')(message);
});

Whatsapp.out('photo', async function(message) {
  return this.sendMediaFactory('image')(message);
});

Whatsapp.out('audio', async function(message) {
  return this.sendMediaFactory('audio', { caption: false })(message);
});

Whatsapp.out('video', async function(message) {
  return this.sendMediaFactory('video')(message);
});

Whatsapp.out('inline-buttons', async function(message) {
  const chatServer = this;
  const options = this.getOptions();
  const context = message.chat();

  const response = await chatServer
    .post(`${options.phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      to: message.payload.chatId,
      type: 'interactive',
      interactive: {
        body: {
          text: message.payload.content
        },
        type: 'button',
        action: {
          buttons: message.payload.buttons
            .filter(({ type }) => type === 'postback')
            .map(txButton)
        }
      }
    });

  await when(context.set({
    messageId: response.message_id,
    outboundMessageId: response.message_id
  }));

  return setMessageId(message, response.messageId);
});

// log messages, these should be the last
Whatsapp.out(function(message) {
  const options = this.getOptions();
  const logfile = options.logfile;
  const chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        const chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Whatsapp.in('*', function(message) {
  const options = this.getOptions();
  const logfile = options.logfile;
  const chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        const chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Whatsapp.registerMessageType('message', 'Message', 'Send a plain text message');
Whatsapp.registerMessageType('location', 'Location', 'Send a map location message');
Whatsapp.registerMessageType('whatsapp-template', 'Whatsapp Template', 'Send Whatsapp template with parameters');
Whatsapp.registerMessageType('inline-buttons', 'Inline buttons', 'Send a message with inline buttons');
Whatsapp.registerMessageType(
  'document',
  'Document',
  'Send a document or generic file',
  file => {
    if (!_.isEmpty(file.extension) && !DOCUMENT_EXTENSIONS.includes(file.extension)) {
      return `Unsupported file format for document node "${file.filename}", allowed formats: ${DOCUMENT_EXTENSIONS.join(', ')}`;
    }
    return null;
  }
);
Whatsapp.registerMessageType(
  'photo',
  'Photo',
  'Send a photo message',
  file => {
    if (!_.isEmpty(file.extension) && !PHOTO_EXTENSIONS.includes(file.extension)) {
      return `Unsupported file format for image node "${file.filename}", allowed formats: ${PHOTO_EXTENSIONS.join(', ')}`;
    }
    if (file.size != null && file.size > MAX_PHOTO_DIMENSIONS) {
      return `Excedeed size for image node "${file.filename}", max size: 5MB}`;
    }
  }
);
Whatsapp.registerMessageType(
  'audio',
  'Audio',
  'Send an audio message',
  file => {
    if (!_.isEmpty(file.extension) && !AUDIO_EXTENSIONS.includes(file.extension)) {
      return `Unsupported file format for audio node "${file.filename}", allowed formats: ${AUDIO_EXTENSIONS.join(', ')}`;
    }
    return null;
  }
);
Whatsapp.registerMessageType(
  'video',
  'Video',
  'Send video message',
  file => {
    if (!_.isEmpty(file.extension) && !VIDEO_EXTENSIONS.includes(file.extension)) {
      return `Unsupported file format for video node "${file.filename}", allowed formats: ${VIDEO_EXTENSIONS.join(', ')}`;
    }
    return null;
  }
);

Whatsapp.registerParam(
  'preview_url',
  'boolean',
  { label: 'Allows for URL previews in text messages', default: false }
);
Whatsapp.registerParam(
  'replyToMessage',
  'boolean',
  { label: 'Reply to message', default: false }
);

Whatsapp.registerEvent('sent', 'Message was sent');
Whatsapp.registerEvent('delivered', 'Message was delivered');
Whatsapp.registerEvent('read', 'Message was read');

module.exports = Whatsapp;
