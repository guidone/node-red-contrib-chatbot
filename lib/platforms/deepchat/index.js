const _ = require('lodash');
const dayjs = require('dayjs');
const md5 = require('md5');
const mime = require('mime');
const fileUpload = require('express-fileupload');
const { ChatExpress } = require('chat-platform');

const FileCache = require('../../file-cache');
const { when } = require('../../helpers/utils');
const ResponseBridge = require('./bridge');
const widget = require('./widget');
const { renderButtons, renderLocation, renderFile } = require('./renderer');

// media served to the widget is kept in memory/tmp for one hour
const FILE_CACHE_EXPIRES_IN = 60;
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;
const FILE_ID_REGEXP = /^[a-f0-9]{32}$/;

const uploader = fileUpload({ limits: { fileSize: MAX_UPLOAD_SIZE } });

/**
 * @method segmentsOf
 * Split the matched route of an inbound request into path segments. Routes are mounted on Express with an
 * anchored RegExp, so the whole path ends up in `req.baseUrl` (which also carries the `httpNodeRoot` prefix)
 * @param {object} req
 * @return {Array<string>}
 */
const segmentsOf = req => {
  const raw = !_.isEmpty(req.baseUrl) ? req.baseUrl : String(req.originalUrl || req.url || '').split('?')[0];
  return raw.split('/').filter(segment => segment !== '');
};

/**
 * @method matchedPath
 * The absolute path (including `httpNodeRoot`) the current request was matched with
 * @param {object} req
 * @return {string}
 */
const matchedPath = req => !_.isEmpty(req.baseUrl) ?
  req.baseUrl : String(req.originalUrl || req.url || '').split('?')[0];

// unique, non guessable id for an outbound message
const newMessageId = () => `deepchat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const setMessageId = (message, messageId) => ({
  ...message,
  payload: { ...message.payload, messageId }
});

/**
 * @method applyCors
 * Add CORS headers when the bot declares a list of allowed origins, needed to embed the widget in a page
 * served by another host. When empty the endpoint stays same origin only
 * @param {object} req
 * @param {object} res
 * @param {string} allowedOrigins comma separated list of origins, "*" for any
 */
const applyCors = (req, res, allowedOrigins) => {
  if (_.isEmpty(allowedOrigins)) {
    return;
  }
  const origins = (_.isArray(allowedOrigins) ? allowedOrigins : String(allowedOrigins).split(','))
    .map(origin => String(origin).trim())
    .filter(origin => origin !== '');
  const origin = req.headers.origin;
  if (_.includes(origins, '*')) {
    res.set('Access-Control-Allow-Origin', '*');
  } else if (!_.isEmpty(origin) && _.includes(origins, origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Credentials', 'true');
  } else {
    return;
  }
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
};

/**
 * @method readJsonBody
 * Read the JSON body of a request, Node-RED doesn't mount a body parser on `httpNode` by default
 * so fall back to reading the raw stream
 * @param {object} req
 * @return {Promise<object>}
 */
const readJsonBody = req => {
  if (req.body != null && (req._body === true || !_.isEmpty(req.body))) {
    return Promise.resolve(req.body);
  }
  if (!req.readable) {
    return Promise.resolve({});
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (_.isEmpty(raw)) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('Invalid JSON body'));
      }
    });
  });
};

const getCookie = (req, name) => {
  if (req.cookies != null && req.cookies[name] != null) {
    return req.cookies[name];
  }
  const header = req.headers.cookie;
  if (_.isEmpty(header)) {
    return null;
  }
  const found = header.split(';')
    .map(chunk => chunk.trim())
    .find(chunk => chunk.startsWith(`${name}=`));
  return found != null ? decodeURIComponent(found.slice(name.length + 1)) : null;
};

/**
 * @method resolveChatId
 * Deep Chat has no notion of a session: the widget is expected to send a `chatId` (see the test page), when
 * it's missing fall back to a cookie so that a bare `<deep-chat>` tag still gets a stable conversation
 * @param {object} req
 * @param {object} res
 * @param {object} body
 * @param {string} botId
 * @return {string}
 */
const resolveChatId = (req, res, body, botId) => {
  const fromBody = body.chatId != null ? String(body.chatId) : null;
  if (!_.isEmpty(fromBody)) {
    return fromBody;
  }
  const fromHeader = req.headers['x-redbot-chatid'];
  if (!_.isEmpty(fromHeader)) {
    return String(fromHeader);
  }
  const cookieName = `redbot-deepchat-${String(botId).replace(/[^A-Za-z0-9_-]/g, '_')}`;
  const fromCookie = getCookie(req, cookieName);
  if (!_.isEmpty(fromCookie)) {
    return fromCookie;
  }
  const chatId = `deepchat-${md5(`${botId}-${Date.now()}-${Math.random()}`)}`;
  res.append('Set-Cookie', `${cookieName}=${encodeURIComponent(chatId)}; Path=/; SameSite=Lax; Max-Age=86400`);
  return chatId;
};

// pick the last message written by the user out of the Deep Chat history
const lastUserText = (messages, fallback) => {
  if (!_.isArray(messages) || _.isEmpty(messages)) {
    // not the shape Deep Chat sends, but makes the endpoint usable with a plain { text } body
    return _.isString(fallback) && !_.isEmpty(fallback) ? fallback : null;
  }
  const userMessages = messages.filter(item => _.isObject(item) && item.role !== 'ai' && _.isString(item.text));
  const last = !_.isEmpty(userMessages) ? _.last(userMessages) : _.last(messages);
  return _.isObject(last) && _.isString(last.text) ? last.text : null;
};

// translate an uploaded file into a RedBot message type
const typeOfFile = mimeType => {
  if (_.isEmpty(mimeType)) {
    return 'document';
  }
  if (mimeType.startsWith('image/')) {
    return 'photo';
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'document';
};

/**
 * @method parseMultipart
 * Deep Chat switches to `multipart/form-data` when the user attaches files: every file is sent under the
 * `files` key and every message as a JSON encoded `message1`, `message2`, ... field
 * @param {object} req
 * @param {object} res
 * @return {Promise<object>} `{ body, files }`
 */
const parseMultipart = async (req, res) => {
  await new Promise((resolve, reject) => {
    uploader(req, res, error => error != null ? reject(error) : resolve());
  });
  const body = req.body || {};
  const messages = _.keys(body)
    .filter(key => /^message\d+$/.test(key))
    .sort((a, b) => parseInt(a.replace('message', ''), 10) - parseInt(b.replace('message', ''), 10))
    .map(key => {
      try {
        return JSON.parse(body[key]);
      } catch (e) {
        return { role: 'user', text: String(body[key]) };
      }
    });
  const files = _.flatten(_.values(req.files || {}).map(file => _.isArray(file) ? file : [file]));
  return { body: { ...body, messages }, files };
};

const DeepChat = new ChatExpress({
  transport: 'deepchat',
  transportDescription: 'Deep Chat',
  color: '#3E80F9',
  inboundMessageEvent: 'message',
  chatIdKey: payload => payload.chatId,
  userIdKey: payload => payload.userId,
  messageIdKey: payload => payload.messageId,
  tsKey: payload => payload.ts != null ? dayjs(payload.ts).toISOString() : dayjs().toISOString(),
  type: payload => payload.type,
  language: payload => payload.language,
  // routes carry the botId in the middle of the path, they can't be generated by appending a suffix
  multiWebHook: false,
  onStart: function() {
    const options = this.getOptions();
    this.cache = FileCache({ expiresIn: FILE_CACHE_EXPIRES_IN });
    this.bridge = ResponseBridge({
      timeout: options.timeout,
      collectWindow: options.collectWindow
    });
    // the widget is the connector: there's no external service to bootstrap
    return true;
  },
  onStop: function() {
    if (this.bridge != null) {
      this.bridge.destroy();
      this.bridge = null;
    }
    if (this.cache != null) {
      this.cache.destroy();
      this.cache = null;
    }
    return Promise.resolve();
  },
  routes: {
    // POST /redbot/deepchat/<botId> - the endpoint the Deep Chat widget connects to
    '/redbot/deepchat/[^/]+': function(req, res, next) {
      const chatServer = this;
      const { botId } = chatServer.getOptions();
      if (_.last(segmentsOf(req)) !== botId) {
        // another Deep Chat bot is mounted on the same wildcard route
        next();
        return;
      }
      handleMessage(chatServer, req, res);
    },
    // GET /redbot/deepchat/<botId>/widget - test page with a widget wired to this bot
    '/redbot/deepchat/[^/]+/widget': function(req, res, next) {
      const chatServer = this;
      const options = chatServer.getOptions();
      const segments = segmentsOf(req);
      if (segments[segments.length - 2] !== options.botId) {
        next();
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.sendStatus(405);
        return;
      }
      const path = matchedPath(req);
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(widget({
        botId: options.botId,
        botname: options.botname,
        endpoint: path.replace(/\/widget$/, ''),
        introMessage: options.introMessage,
        acceptFiles: options.acceptFiles,
        cdn: options.cdn
      }));
    },
    // GET /redbot/deepchat/<botId>/files/<id> - media produced by the flow
    '/redbot/deepchat/[^/]+/files/[^/]+': function(req, res, next) {
      const chatServer = this;
      const { botId } = chatServer.getOptions();
      const segments = segmentsOf(req);
      if (segments[segments.length - 3] !== botId) {
        next();
        return;
      }
      const id = _.last(segments);
      if (!FILE_ID_REGEXP.test(id) || chatServer.cache == null || !chatServer.cache.exists(id)) {
        res.sendStatus(404);
        return;
      }
      if (req.method === 'HEAD') {
        res.sendStatus(200);
        return;
      }
      chatServer.cache.get(id)
        .then(file => {
          res.contentType(file.contentType || 'application/octet-stream');
          res.end(file.buffer, 'binary');
        })
        .catch(() => res.sendStatus(500));
    }
  },
  routesDescription: {
    '/redbot/deepchat/[^/]+': function() {
      return `Deep Chat endpoint for bot "${this.getOptions().botId}"`;
    },
    '/redbot/deepchat/[^/]+/widget': function() {
      return `Deep Chat test page for bot "${this.getOptions().botId}"`;
    },
    '/redbot/deepchat/[^/]+/files/[^/]+': 'Media sent by the flow to the Deep Chat widget'
  }
});

/**
 * @method handleMessage
 * Handle an inbound request from the widget: hand the message over to the flow and hold the response open
 * until the flow is done answering (or the timeout expires)
 * @param {object} chatServer
 * @param {object} req
 * @param {object} res
 */
async function handleMessage(chatServer, req, res) {
  const options = chatServer.getOptions();
  const { botId } = options;

  applyCors(req, res, options.allowedOrigins);
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  if (chatServer.bridge == null) {
    // the request landed while the bot was shutting down
    res.status(503).json({ error: 'Chatbot is not running' });
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST is allowed on this endpoint' });
    return;
  }

  let body = {};
  let files = [];
  try {
    if (String(req.headers['content-type'] || '').startsWith('multipart/form-data')) {
      if (options.acceptFiles === false) {
        res.status(415).json({ error: 'This chatbot doesn\'t accept file uploads' });
        return;
      }
      const parsed = await parseMultipart(req, res);
      body = parsed.body;
      files = parsed.files;
    } else {
      body = await readJsonBody(req);
    }
  } catch (error) {
    chatServer.emit('error', error);
    res.status(400).json({ error: 'Unable to read the request' });
    return;
  }

  const chatId = resolveChatId(req, res, body, botId);
  const userId = body.userId != null && !_.isEmpty(String(body.userId)) ? String(body.userId) : chatId;
  const text = lastUserText(body.messages, body.text);

  if (_.isEmpty(text) && _.isEmpty(files)) {
    res.status(400).json({ error: 'Empty message' });
    return;
  }

  const common = {
    botId,
    chatId,
    userId,
    ts: dayjs().toISOString(),
    language: !_.isEmpty(body.language) ? String(body.language) : null
  };

  // start collecting before handing the message to the flow, the answer may be immediate
  const collecting = chatServer.bridge.open(chatId);

  if (_.isEmpty(files)) {
    chatServer.receive({ ...common, messageId: newMessageId(), type: 'message', text });
  } else {
    // the text typed along with the attachments becomes the caption of the first file
    files.forEach((file, index) => {
      chatServer.receive({
        ...common,
        messageId: newMessageId(),
        type: typeOfFile(file.mimetype),
        text: index === 0 ? text : null,
        file: {
          buffer: file.data,
          filename: file.name,
          mimeType: file.mimetype,
          size: file.size
        }
      });
    });
  }

  res.json(await collecting);
}

// text messages
DeepChat.in(function(message) {
  const botMsg = message.originalMessage;
  if (botMsg.type === 'message') {
    message.payload.content = botMsg.text;
  }
  return message;
});

// attachments, the content is the buffer of the uploaded file like in every other platform
DeepChat.in(function(message) {
  const botMsg = message.originalMessage;
  if (botMsg.file != null) {
    message.payload.content = botMsg.file.buffer;
    message.payload.filename = botMsg.file.filename;
    message.payload.mimeType = botMsg.file.mimeType;
    message.payload.size = botMsg.file.size;
    if (!_.isEmpty(botMsg.text)) {
      message.payload.caption = botMsg.text;
    }
  }
  return message;
});

// Deep Chat suggestion buttons submit their label as a plain user message, translate it back into the
// value of the button that was sent last, same semantics of a Telegram callback_data
DeepChat.in(async function(message) {
  if (message.payload.type !== 'message' || !_.isString(message.payload.content)) {
    return message;
  }
  const context = message.chat();
  if (context == null) {
    return message;
  }
  // a single key returns the value itself, not a hash
  const deepchatLastButtons = await when(context.get('deepchatLastButtons'));
  if (_.isEmpty(deepchatLastButtons) || !_.isArray(deepchatLastButtons)) {
    return message;
  }
  const button = deepchatLastButtons
    .find(item => item.type === 'postback' && item.label === message.payload.content);
  if (button != null) {
    message.payload.content = !_.isEmpty(button.value) ? button.value : button.label;
  }
  await when(context.remove('deepchatLastButtons'));
  return message;
});

/**
 * @method push
 * Deliver a Deep Chat response to the request that is currently open for this conversation, buffer it if the
 * flow is answering out of band (i.e. Push Message node)
 * @param {object} chatServer
 * @param {object} message
 * @param {object} response
 * @return {object} the outbound message with a message id
 */
const push = (chatServer, message, response) => {
  const messageId = newMessageId();
  chatServer.bridge.push(message.payload.chatId, response);
  return setMessageId(message, messageId);
};

DeepChat.out('message', async function(message) {
  return push(this, message, { text: message.payload.content, role: 'ai' });
});

DeepChat.out('location', async function(message) {
  return push(this, message, renderLocation(message.payload));
});

const outButtons = async function(message) {
  // a message forged by the flow (i.e. Push Message node) may not carry a context
  const context = _.isFunction(message.chat) ? message.chat() : null;
  // remember the buttons to translate the label the widget will send back into the button value
  if (context != null) {
    await when(context.set({ deepchatLastButtons: message.payload.buttons }));
  }
  return push(this, message, renderButtons(message.payload));
};

DeepChat.out('inline-buttons', outButtons);
DeepChat.out('quick-replies', outButtons);

/**
 * @method sendMedia
 * Store the media in the local cache and hand the widget a url pointing back to this bot
 * @param {object} chatServer
 * @param {object} message
 * @return {Promise<object>}
 */
const sendMedia = async (chatServer, message) => {
  const options = chatServer.getOptions();
  const { payload } = message;
  let src;

  if (Buffer.isBuffer(payload.content)) {
    const id = md5(payload.content);
    const contentType = !_.isEmpty(payload.mimeType) ?
      payload.mimeType : (mime.lookup(payload.filename || '') || 'application/octet-stream');
    await chatServer.cache.store(id, payload.content, { contentType });
    const prefix = !_.isEmpty(options.publicUrl) ? String(options.publicUrl).replace(/\/$/, '') : '';
    src = `${prefix}/redbot/deepchat/${options.botId}/files/${id}`;
  } else if (_.isString(payload.content) && !_.isEmpty(payload.content)) {
    // a plain url, hand it over to the widget as it is
    src = payload.content;
  } else {
    throw new Error(`Deep Chat is unable to send a "${payload.type}" without a buffer or a url`);
  }

  const outbound = push(chatServer, message, renderFile(payload, src));
  if (!_.isEmpty(payload.caption)) {
    chatServer.bridge.push(payload.chatId, { text: payload.caption, role: 'ai' });
  }
  return outbound;
};

DeepChat.out('photo', async function(message) { return sendMedia(this, message); });
DeepChat.out('video', async function(message) { return sendMedia(this, message); });
DeepChat.out('audio', async function(message) { return sendMedia(this, message); });
DeepChat.out('document', async function(message) { return sendMedia(this, message); });

DeepChat.registerMessageType('message', 'Message', 'Send a plain text message');
DeepChat.registerMessageType('location', 'Location', 'Send a map location message');
DeepChat.registerMessageType('inline-buttons', 'Inline buttons', 'Send a message with inline buttons');
DeepChat.registerMessageType('quick-replies', 'Quick Replies', 'Send a message with quick replies');
DeepChat.registerMessageType('photo', 'Photo', 'Send a photo');
DeepChat.registerMessageType('video', 'Video', 'Send a video');
DeepChat.registerMessageType('audio', 'Audio', 'Send an audio file');
DeepChat.registerMessageType('document', 'Document', 'Send a document or generic file');

module.exports = DeepChat;
