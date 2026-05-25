const _ = require('lodash');
const dayjs = require('dayjs');
const fetch = require('node-fetch');

const { ChatExpress } = require('chat-platform');

const utils = require('../../lib/helpers/utils');
const { params } = utils;

// Sinch Conversation API base URL. Region is selectable (us, eu, br, ap) — defaults to us.
const regionBaseUrl = region => {
  switch (region) {
    case 'eu': return 'https://eu.conversation.api.sinch.com';
    case 'br': return 'https://br.conversation.api.sinch.com';
    case 'ap': return 'https://ap.conversation.api.sinch.com';
    case 'us':
    default: return 'https://us.conversation.api.sinch.com';
  }
};

const AUTH_URL = 'https://auth.sinch.com/oauth2/token';

// OAuth2 client_credentials — Sinch returns a Bearer token with `expires_in` (seconds).
// Cached on the server options and refreshed 60s before expiry.
async function fetchAccessToken(options) {
  const basic = Buffer.from(`${options.keyId}:${options.keySecret}`).toString('base64');
  const response = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Sinch auth failed (${response.status}): ${body}`);
  }
  const json = await response.json();
  return {
    accessToken: json.access_token,
    expiresAt: Date.now() + ((json.expires_in - 60) * 1000)
  };
}

async function getAccessToken(options) {
  if (options._tokenCache != null && options._tokenCache.expiresAt > Date.now()) {
    return options._tokenCache.accessToken;
  }
  options._tokenCache = await fetchAccessToken(options);
  return options._tokenCache.accessToken;
}

async function sinchApiCall(options, path, body) {
  const accessToken = await getAccessToken(options);
  const url = `${regionBaseUrl(options.region)}/v1/projects/${options.projectId}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Sinch API ${path} failed (${response.status}): ${errBody}`);
  }
  return response.json();
}

const Sinch = new ChatExpress({
  color: '#2A8FBD',
  inboundMessageEvent: 'message',
  transport: 'sinch',
  transportDescription: 'Sinch',
  relaxChatId: true,
  chatIdKey: function(payload) {
    if (payload.message != null && payload.message.contact_id != null) {
      return payload.message.contact_id;
    }
    return payload.contact_id != null ? payload.contact_id : null;
  },
  userIdKey: function(payload) {
    if (payload.message != null && payload.message.contact_id != null) {
      return payload.message.contact_id;
    }
    return payload.contact_id != null ? payload.contact_id : null;
  },
  messageIdKey: function(payload) {
    if (payload.message != null && payload.message.id != null) {
      return payload.message.id;
    }
    return payload.message_id;
  },
  tsKey: function(payload) {
    const ts = payload.accepted_time || payload.event_time
      || (payload.message != null ? payload.message.accept_time : null);
    return ts != null ? dayjs(ts).toISOString() : dayjs().toISOString();
  },
  type: function() {
    // todo remove this
  },
  language: function(/* payload */) {
    return null;
  },
  onStop: function() {
    var options = this.getOptions();
    options._tokenCache = null;
    return Promise.resolve();
  },
  onStart: function() {
    // nothing to bootstrap — Conversation API is HTTP-only and inbound messages
    // arrive via the registered /redbot/sinch webhook route
    return true;
  },
  routes: {
    '/redbot/sinch/test': function(req, res) {
      res.send('ok');
    },
    '/redbot/sinch': function(req, res) {
      const chatServer = this;
      const json = req.body;

      // MESSAGE_INBOUND is the standard contact-to-app event from Sinch Conversation API
      const triggerType = json != null ? (json.trigger || json.event_type) : null;
      if (json != null && json.message != null && (triggerType == null || triggerType === 'MESSAGE_INBOUND')) {
        chatServer.receive(json);
      }
      res.send({ status: 'ok' });
    }
  },
  multiWebHook: false/*,
  webHookScheme: function() {
    const { webHook } = this.getOptions();
    const match = (webHook || '').match(/\/redbot\/sinch\/(.*)$/);
    return match != null ? match[1] : '';
  }*/
});

// extract plain text messages from a Conversation API inbound payload
Sinch.in(function(message) {
  const botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    const contactMessage = botMsg.message != null ? botMsg.message.contact_message : null;
    if (contactMessage != null && contactMessage.text_message != null) {
      message.payload.content = contactMessage.text_message.text;
      message.payload.type = 'message';
    }
    resolve(message);
  });
});

// extract location message
Sinch.in(function(message) {
  const botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    const contactMessage = botMsg.message != null ? botMsg.message.contact_message : null;
    if (contactMessage != null && contactMessage.location_message != null) {
      message.payload.content = {
        latitude: contactMessage.location_message.coordinates != null ? contactMessage.location_message.coordinates.latitude : null,
        longitude: contactMessage.location_message.coordinates != null ? contactMessage.location_message.coordinates.longitude : null,
        label: contactMessage.location_message.label,
        title: contactMessage.location_message.title
      };
      message.payload.type = 'location';
    }
    resolve(message);
  });
});

// extract media (image, video, document) — content stays as the remote URL since the
// platform itself doesn't host media downloads
Sinch.in(function(message) {
  const botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    const contactMessage = botMsg.message != null ? botMsg.message.contact_message : null;
    if (contactMessage == null) {
      resolve(message);
      return;
    }
    if (contactMessage.media_message != null) {
      message.payload.url = contactMessage.media_message.url;
      message.payload.content = contactMessage.media_message.url;
      message.payload.type = 'photo';
    } else if (contactMessage.media_card_message != null) {
      message.payload.url = contactMessage.media_card_message.url;
      message.payload.content = contactMessage.media_card_message.url;
      message.payload.caption = contactMessage.media_card_message.title;
      message.payload.type = 'photo';
    }
    resolve(message);
  });
});

// send a plain text message via Conversation API
Sinch.out('message', async function(message) {
  const options = this.getOptions();
  const chatServer = this;
  const param = params(message);

  const body = {
    app_id: options.appId,
    recipient: { contact_id: message.payload.chatId },
    message: {
      text_message: { text: message.payload.content }
    }
  };
  const channelPriority = param('channelPriority', null);
  if (!_.isEmpty(channelPriority)) {
    body.channel_priority_order = _.isArray(channelPriority) ? channelPriority : [channelPriority];
  }

  const result = await sinchApiCall(options, '/messages:send', body);
  chatServer.emit && chatServer.emit('debug', { topic: 'sinch.sent', payload: result });
  return {
    ...message,
    payload: {
      ...message.payload,
      messageId: result.message_id
    }
  };
});

// send a location
Sinch.out('location', async function(message) {
  const options = this.getOptions();
  const body = {
    app_id: options.appId,
    recipient: { contact_id: message.payload.chatId },
    message: {
      location_message: {
        title: message.payload.title || '',
        label: message.payload.label || '',
        coordinates: {
          latitude: message.payload.content.latitude,
          longitude: message.payload.content.longitude
        }
      }
    }
  };
  const result = await sinchApiCall(options, '/messages:send', body);
  return {
    ...message,
    payload: { ...message.payload, messageId: result.message_id }
  };
});

// send a media (photo / document) — Conversation API accepts a public URL in `media_message`
async function sendMedia(self, message, type) {
  const options = self.getOptions();
  const url = _.isString(message.payload.content) ? message.payload.content : message.payload.url;
  if (_.isEmpty(url)) {
    throw new Error(`Sinch ${type} requires a public URL in payload.content`);
  }
  const body = {
    app_id: options.appId,
    recipient: { contact_id: message.payload.chatId },
    message: {
      media_message: { url }
    }
  };
  const result = await sinchApiCall(options, '/messages:send', body);
  return {
    ...message,
    payload: { ...message.payload, messageId: result.message_id }
  };
}

Sinch.out('photo', async function(message) { return sendMedia(this, message, 'photo'); });
Sinch.out('video', async function(message) { return sendMedia(this, message, 'video'); });
Sinch.out('document', async function(message) { return sendMedia(this, message, 'document'); });
Sinch.out('audio', async function(message) { return sendMedia(this, message, 'audio'); });

Sinch.registerMessageType('message', 'Message', 'Send a plain text message');
Sinch.registerMessageType('photo', 'Photo', 'Send a photo via a public URL');
Sinch.registerMessageType('video', 'Video', 'Send a video via a public URL');
Sinch.registerMessageType('document', 'Document', 'Send a document via a public URL');
Sinch.registerMessageType('audio', 'Audio', 'Send an audio file via a public URL');
Sinch.registerMessageType('location', 'Location', 'Send a map location message');

Sinch.registerParam(
  'channelPriority',
  'string',
  {
    label: 'Channel priority',
    description: 'Comma-separated list of channels in priority order (e.g. SMS,WHATSAPP,RCS)',
    placeholder: 'SMS,WHATSAPP'
  }
);

module.exports = Sinch;
