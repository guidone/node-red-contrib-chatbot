const _ = require('underscore');
const validators = require('../helpers/validators');
const moment = require('moment');

const { ChatExpress, ChatLog } = require('chat-platform');

const TelegramBot = require('node-telegram-bot-api');
const request = require('request').defaults({ encoding: null });
const utils = require('../../lib/helpers/utils');
const helpers = require('../../lib/helpers/regexps');

const {
  getMessageId,
  when,
  params
} = require('../../lib/helpers/utils');

// set the messageId in a returning payload
const setMessageId = (message, messageId) => ({
  ...message,
  payload: {
    ...message.payload,
    messageId
  }
});

const sendAnimation = function(chatId, animation, options = {}, fileOptions = {}) {
  const opts = {
    qs: options
  };
  opts.qs.chat_id = chatId;
  try {
    const sendData = this._formatSendData('animation', animation, fileOptions);
    opts.formData = sendData[0];
    opts.qs.animation = sendData[1];
  } catch (ex) {
    return Promise.reject(ex);
  }
  return this._request('sendAnimation', opts);
};

// convert to the weird dialect of Telegram
const convertMarkdown = content => content
  .replace(/\*\*(.*?)\*\*/g, '--$1--') // tmp replacement
  .replace(/\*(.*?)\*/g, '_$1_')
  .replace(/\-\-(.*?)\-\-/g, '*$1*');

const MESSAGE_MAX_SIZE = 4096;

const Telegram = new ChatExpress({
  color: '#336699',
  inboundMessageEvent: 'message',
  transport: 'telegram',
  transportDescription: 'Telegram',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    return payload.chat != null ? payload.chat.id : null;
  },
  userIdKey: function(payload) {
    return payload.from.id;
  },
  messageIdKey: function(payload) {
    return payload.message_id;
  },
  tsKey: function(payload) {
    return moment.unix(payload.date);
  },
  type: function() {
    // todo remove this
  },
  language: function(payload) {
    return payload != null && payload.from != null ? payload.from.language_code : null;
  },
  onStop: function() {
    var options = this.getOptions();
    return new Promise(function(resolve) {
      if (options.connector != null) {
        if (options.connectMode === 'webHook') {
          // cancel the web hook on stop
          options.connector.deleteWebHook()
            .then(function() {
              options.connector = null;
              resolve();
            }, function() {
              resolve();
            });
        } else if (options.connectMode === 'polling') {
          // stop polling
          options.connector.stopPolling()
            .then(function() {
              options.connector = null;
              resolve();
            }, function() {
              resolve();
            });
        }
      } else {
        resolve();
      }
    });
  },
  onStart: function() {
    var options = this.getOptions();
    if (options.connectMode === 'webHook') {
      options.connector = new TelegramBot(options.token);
      options.connector.sendAnimation = sendAnimation.bind(options.connector);
      return options.connector.setWebHook(options.webHook);
    } else if (options.connectMode === 'polling') {
      options.connector = new TelegramBot(options.token, {
        polling: {
          params: {
            timeout: 10
          },
          interval: !isNaN(parseInt(options.polling, 10)) ? parseInt(options.polling, 10) : 1000
        }
      });
      options.connector.sendAnimation = sendAnimation.bind(options.connector);
      return true;
    } else {
      throw 'Unkown connection mode';
    }
  },
  routes: {
    '/redbot/telegram/test': function(req, res) {
      res.send('ok');
    },
    '/redbot/telegram': function(req, res) {
      const chatServer = this;
      const json = req.body;
      if (json.message != null) {
        chatServer.receive(json.message);
      } else if (json.edited_message != null) {
        chatServer.receive(json.edited_message);
      } else if (json.callback_query != null) {
        this.callbackQuery(json.callback_query);
      }
      res.send({ status: 'ok' });
    }
  },
  multiWebHook: true,
  webHookScheme: function() {
    const { connectMode, webHook } = this.getOptions();
    // if polling return the base link, if not extract the subpath after /redbot/telegram/
    if (connectMode === 'webHook') {
      const match = (webHook || '').match(/\/redbot\/telegram\/(.*)$/);
      return match != null ? match[1] : '';
    }
    return '';
  },
  events: {
    inline_query: function(botMsg) {
      botMsg.inlineQueryId = botMsg.id;
      delete botMsg.id;
      this.receive(botMsg);
    },
    callback_query: function(botMsg) {
      this.callbackQuery(botMsg);
    },
    pre_checkout_query: function(botMsg) {
      var chatServer = this;
      var options = this.getOptions();
      var connector = options.connector;
      // send confirmation
      connector.answerPreCheckoutQuery(botMsg.id, true)
        .then(
          function() {
          },
          function() {
            chatServer.error('Error on .answerPreCheckoutQuery(), checkout: ' + botMsg.id);
          });
    },
    shipping_query: function(botMsg) {
      var chatServer = this;
      // bounce the message into the flow
      chatServer.receive({
        from: botMsg.from,
        shipping_query_id: botMsg.id,
        invoice_payload: botMsg.invoice_payload,
        shipping_address: botMsg.shipping_address
      });
    }
  }
});

// detect new user in group
Telegram.in(function(message) {
  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    if (_.isArray(botMsg.new_chat_members) && !_.isEmpty(botMsg.new_chat_members)) {
      message.payload.newUsers = botMsg.new_chat_members;
      message.payload.type = 'event';
      message.payload.eventType = 'new-user';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

// detect inline query
Telegram.in(function(message) {
  return new Promise(function(resolve) {
    if (message.originalMessage.query != null) {
      message.payload.content = message.originalMessage.query;
      message.payload.type = 'inline-query';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    var connector = message.client();
    if (message.originalMessage.sticker != null) {
      connector.getFileLink(message.originalMessage.sticker.file_id)
        .then(function(imageUrl) {
          return chatServer.request({ url: imageUrl });
        })
        .then(
          function(image) {
            message.payload.type = 'photo';
            message.payload.content = image;
            resolve(message);
          },
          function(err) {
            reject(err);
          }
        );
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  return new Promise(function(resolve) {
    if (_.isString(message.originalMessage.text) && !_.isEmpty(message.originalMessage.text)) {
      message.payload.content = message.originalMessage.text;
      message.payload.type = 'message';
      if (helpers.isCommand(message.originalMessage.text)) {
        message.payload.arguments = message.originalMessage.text.split(' ').slice(1);
      }
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    if (botMsg.location != null) {
      message.payload.content = botMsg.location;
      message.payload.type = 'location';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    if (botMsg.contact != null) {
      message.payload.content = botMsg.contact;
      message.payload.type = 'contact';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    if (botMsg.successful_payment != null) {
      message.payload.content = botMsg.successful_payment;
      message.payload.type = 'payment';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {

  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {

    if (botMsg.shipping_query_id != null) {
      message.payload.shippingQueryId = botMsg.shipping_query_id;
      message.payload.payload = botMsg.payload;
      message.payload.shippingAddress = botMsg.shipping_address;
      message.payload.type = 'invoice-shipping';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(async function(message) {
  const context = message.chat();
  const options = this.getOptions();
  const authorizedUsernames = (options.authorizedUsernames || '').split(',');
  const userId = String(message.originalMessage.from.id);
  const vars = {};

  const { firstName, lastName, username } =  await when(context.get('firstName', 'lastName', 'username')) || {};
  // only change if not defined
  if (_.isEmpty(firstName) && !_.isEmpty(message.originalMessage.from.first_name)) {
    vars.firstName = message.originalMessage.from.first_name;
  }
  if (_.isEmpty(lastName) && !_.isEmpty(message.originalMessage.from.last_name)) {
    vars.lastName = message.originalMessage.from.last_name;
  }
  if (_.isEmpty(username) && !_.isEmpty(message.originalMessage.from.username)) {
    vars.username = message.originalMessage.from.username;
  }
  // set auth
  vars.authorized = false;
  if (_.isArray(authorizedUsernames) && !_.isEmpty(authorizedUsernames)) {
    if (authorizedUsernames.includes(String(userId)) || authorizedUsernames.includes(username)) {
      vars.authorized = true;
    }
  }
  // store back
  if (!_.isEmpty(vars)) {
    await when(context.set(vars))
  }

  return message;
});

Telegram.in(async function(message) {
  const options = this.getOptions();
  const connector = options.connector;
  const skipMediaFiles = options.skipMediaFiles === true;
  const botMsg = message.originalMessage;
  const chatServer = this;

  let type = null;
  let fileId = null;
  let duration = null;
  // download one of these binary types
  if (botMsg.photo != null) {
    type = 'photo';
    fileId = _(botMsg.photo).last().file_id;
  } else if (botMsg.video != null) {
    type = 'video';
    fileId = botMsg.video.file_id;
  } else if (botMsg.voice != null) {
    type = 'audio';
    fileId = botMsg.voice.file_id;
    duration = botMsg.voice.duration;
  } else if (botMsg.document != null) {
    type = 'document';
    fileId = botMsg.document.file_id;
  } else if (botMsg.video_note != null) {
    type = 'video_note';
    fileId = botMsg.video_note.file_id;
    duration = botMsg.video_note.duration;
  }
  // if not one of these pass thru
  if (type != null) {
    // skip media files (for example for performance reason)
    if (skipMediaFiles) {
      // eslint-disable-next-line no-console
      console.log(`Skipped download file id (${fileId})`);
      return message;
    }
    message.payload.type = type;
    try {
      const path = await connector.getFileLink(fileId);
      const buffer = await chatServer.downloadFile(path);
      message.payload.content = buffer;
      message.payload.caption = botMsg.caption;
      message.payload.duration = duration;
      return message;
    } catch(e) {
      throw 'Error downloading photo.' + e;
    }
  }

  return message;
});

Telegram.out('photo', async function(message) {
  const connector = this.getOptions().connector;
  const param = params(message);
  const result = await connector.sendPhoto(message.payload.chatId, message.payload.content, {
      caption: message.payload.caption,
      disable_notification: param('silent', false),
      parse_mode: param('parseMode', null),
      reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
    });
  return setMessageId(message, result.message_id);
});

Telegram.out('video', async function(message) {
  const connector = this.getOptions().connector;
  const param = params(message);

  const result = await connector.sendVideo(
    message.payload.chatId,
    message.payload.content,
    {
      caption: message.payload.caption,
      disable_notification: param('silent', false),
      parse_mode: param('parseMode', null),
      reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
    },
    {
      filename: message.payload.filename
    }
  );
  return setMessageId(message, result.message_id);
});

Telegram.out('document', async function(message) {
  const connector = this.getOptions().connector;
  const param = params(message);

  const result = await connector.sendDocument(
    message.payload.chatId,
    message.payload.content,
    {
      caption: message.payload.caption,
      parse_mode: param('parseMode', null),
      disable_notification: param('silent', false),
      reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
    },
    {
      // remove extension, telegram will put on the end
      filename: !_.isEmpty(message.payload.filename) ? message.payload.filename.replace(/\.[^.]+$/, '') : null
    }
  );
  return setMessageId(message, result.message_id);
});

Telegram.out('audio', async function(message) {
  const connector = this.getOptions().connector;
  const param = params(message);

  const result = await connector.sendVoice(
    message.payload.chatId,
    message.payload.content,
    {
      caption: message.payload.caption,
      parse_mode: param('parseMode', null),
      duration: message.payload.duration,
      disable_notification: param('silent', false),
      reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
    },
    {
      filename: message.payload.filename
    }
  );
  return setMessageId(message, result.message_id);
});

Telegram.out('reset-buttons', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;
  const param = params(message);

  await connector
    .sendMessage(
      message.payload.chatId,
      message.payload.content,
      {
        reply_markup: { remove_keyboard: true },
        parse_mode: param('parseMode', null),
        disable_web_page_preview: param('disableWebPagePreview', false),
        disable_notification: param('silent', false),
        reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
      }
    );
  return message;
});

Telegram.out('buttons', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;
  const param = params(message);
  const chatServer = this;

  if (_.isEmpty(message.payload.content)) {
    throw 'Buttons node needs a non-empty message';
  }
  const keyboard = [[]];
  _(message.payload.buttons).each(button => {
    let json = null;
    switch(button.type) {
      case 'keyboardButton':
        json = button.label;
        break;
      case 'newline':
        keyboard.push([]);
        break;
      default:
        chatServer.warn('Telegram is not able to handle this button type "' + button.type + '"');
    }
    if (json != null) {
      // add the button to the last row, if any
      keyboard[keyboard.length - 1].push(json);
    }
  });

  const buttons = {
    reply_markup: JSON.stringify({
      keyboard: keyboard,
      resize_keyboard: true,
      one_time_keyboard: true
    }),
    parse_mode: param('parseMode', null),
    disable_web_page_preview: param('disableWebPagePreview', false),
    disable_notification: param('silent', false),
    reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
  };
  // finally send
  const result = await connector.sendMessage(
    message.payload.chatId,
    message.payload.content,
    buttons
  );
  return setMessageId(message, result.message_id);
});

Telegram.out('request', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;
  const param = params(message);

  let keyboard = null;
  if (message.payload.requestType === 'location') {
    keyboard = [
      [{
        text: !_.isEmpty(message.payload.label) ? message.payload.label : 'Send your position',
        request_location: true
      }]
    ];
  } else if (message.payload.requestType === 'phone-number') {
    keyboard = [
      [{
        text: !_.isEmpty(message.payload.label) ? message.payload.label : 'Send your phone number',
        request_contact: true
      }]
    ];
  }
  if (keyboard != null) {
    const result = await connector
      .sendMessage(message.payload.chatId, message.payload.content, {
        reply_markup: JSON.stringify({
          keyboard: keyboard,
          'resize_keyboard': true,
          'one_time_keyboard': true
        }),
        parse_mode: param('parseMode', null),
        disable_web_page_preview: param('disableWebPagePreview', false),
        disable_notification: param('silent', false),
        reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
      });
      return setMessageId(message, result.message_id);
  } else {
    throw 'Request type not supported';
  }
});

Telegram.out('inline-buttons', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;
  const chatServer = this;
  const context = message.chat();
  const param = params(message);
  const modifyMessageId = param('modifyMessageId') || message.originalMessage.modifyMessageId; // for retro compatibility

  // create inline buttons, docs for this is https://core.telegram.org/bots/api#inlinekeyboardmarkup
  // create the first array of array
  const inlineKeyboard = [[]];
  const chatId = message.payload.chatId;
  // cycle through buttons, add new line at the end if flag
  message.payload.buttons.forEach(button => {
    let json = null;
    switch(button.type) {
      case 'url':
        json = {
          text: button.label,
          url: button.url
        };
        break;
      case 'postback':
        json = {
          text: button.label,
          callback_data: !_.isEmpty(button.value) ? button.value : button.label
        };
        break;
      case 'newline':
        inlineKeyboard.push([]);
        break;
      default:
        chatServer.warn('Telegram is not able to handle this button type "' + button.type + '"');
    }
    if (json != null) {
      // add the button to the last row, if any
      inlineKeyboard[inlineKeyboard.length - 1].push(json);
    }
  });

  // store the last buttons, this will be handled by the receiver
  if (connector.lastInlineButtons == null) {
    connector.lastInlineButtons = {};
  }
  connector.lastInlineButtons[chatId] = message.payload.buttons;

  // send buttons or edit
  let result;
  if (modifyMessageId != null) {
    // change content of message
    await connector.editMessageText(message.payload.content, {
      chat_id: chatId,
      message_id: modifyMessageId
    });
    // change buttons of message
    result = await connector.editMessageReplyMarkup(JSON.stringify({
      inline_keyboard: inlineKeyboard
    }), {
      chat_id: chatId,
      message_id: modifyMessageId
    });
  } else {
    // finally send
    result = await connector.sendMessage(chatId, message.payload.content, {
      reply_markup: JSON.stringify({
        inline_keyboard: inlineKeyboard
      }),
      parse_mode: param('parseMode', null),
      disable_web_page_preview: param('disableWebPagePreview', false),
      disable_notification: param('silent', false),
      reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
    });
  }
  // store message id
  await when(context.set({
    messageId: result.message_id,
    outboundMessageId: result.message_id
  }));

  return setMessageId(message, result.message_id);
});

Telegram.out(async function(message) {
  const options = this.getOptions();
  const connector = options.connector;
  const param = params(message);
  const deleteMessageId = param('deleteMessageId');

  if (deleteMessageId) {
    connector.deleteMessage(
      message.originalMessage.chatId,
      deleteMessageId
    );
    message.payload = {};
  }
  return message;
});

Telegram.out('message', async function(message) {
  const options = this.getOptions();
  const connector = options.connector ;
  const context = message.chat();
  const param = params(message);
  const modifyMessageId = param('modifyMessageId') || message.originalMessage.modifyMessageId; // for retro compatibility

  let content = message.payload.content;
  // convert the different markdown dialect of Telegram
  if (param('parseMode', null) === 'Markdown' && !_.isEmpty(content)) {
    content = convertMarkdown(content);
  }

  let result = null;
  if (modifyMessageId != null) {
    result = await connector.editMessageText(content, {
      chat_id: message.payload.chatId,
      message_id: modifyMessageId,
      disable_notification: param('silent', false)
    });
  } else {
    const chunks = utils.split(content, MESSAGE_MAX_SIZE);
    for(let idx = 0; idx < chunks.length; idx++) {
      result = await connector.sendMessage(message.payload.chatId, chunks[idx], {
        parse_mode: param('parseMode', null),
        disable_web_page_preview: param('disableWebPagePreview', false),
        disable_notification: param('silent', false),
        reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
      });
    }
  }
  // store message id
  await when(context.set({
    messageId: result.message_id,
    outboundMessageId: result.message_id
  }));

  return setMessageId(message, result.message_id);
});

Telegram.out('action', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;

  await connector.sendChatAction(message.payload.chatId, message.payload.waitingType != null ? message.payload.waitingType : 'typing')
  return message;
});

Telegram.out('location', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;

  const result = await connector.sendLocation(
    message.payload.chatId,
    message.payload.content.latitude,
    message.payload.content.longitude,
    message.payload.options
  );

  return setMessageId(message, result.message_id);
});

Telegram.out('inline-query-answer', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;

  const inlineQueryId = message.originalMessage.inlineQueryId;
  // do some checks
  if (_.isEmpty(inlineQueryId)) {
    throw 'Empty inlineQueryId';
  }
  if (!_.isArray(message.payload.content)) {
    throw 'Invalid inline query answer';
  }
  const inlineOptions = {};
  if (validators.integer(message.payload.caching)) {
    inlineOptions.cache_time = message.payload.caching;
  }
  if (validators.boolean(message.payload.personal)) {
    inlineOptions.is_personal = message.payload.personal;
  }

  await connector.answerInlineQuery(inlineQueryId, message.payload.content, inlineOptions);

  return message;
});

Telegram.out('invoice', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;

  if (_.isEmpty(options.providerToken)) {
    throw 'Missing providerToken in Telegram chatbot configuration, needed to send an invoice.';
  }

  const invoiceOptions = {
    need_name: message.payload.needName,
    need_phone_number: message.payload.needPhoneNumber,
    need_email: message.payload.needEmail,
    need_shipping_address: message.payload.needShippingAddress,
    is_flexible: message.payload.isFlexible
  };
  const prices = _(message.payload.prices).map(price => {
    return {
      label: price.label,
      amount: Math.floor(parseFloat(price.amount) * 100)
    }
  });
  if (!_.isEmpty(message.payload.photoUrl)) {
    invoiceOptions.photo_url = message.payload.photoUrl;
    invoiceOptions.photo_width = message.payload.photoWidth;
    invoiceOptions.photo_height = message.payload.photoHeight;
  }

  const result = await connector.sendInvoice(
    message.payload.chatId,
    message.payload.title,
    message.payload.description,
    message.payload.payload,
    options.providerToken,
    message.payload.startParameter,
    message.payload.currency,
    prices,
    invoiceOptions
  );

  return setMessageId(message, result.message_id);
});

Telegram.out('invoice-shipping', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;

  const shippingOptions = _(message.payload.shippingOptions).map(function(shippingOption) {
    return {
      id: shippingOption.id,
      title: shippingOption.label,
      prices: [{ label: shippingOption.id, amount: Math.floor(shippingOption.amount * 100) }]
    };
  });
  const canShip = !_.isEmpty(shippingOptions);
  await connector.answerShippingQuery(message.payload.shippingQueryId, canShip, { shipping_options: shippingOptions });
  return message;
});

Telegram.out('sticker', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;
  const param = params(message);

  const result = await connector.sendSticker(
    message.payload.chatId,
    message.payload.content,
    {
      disable_notification: param('silent', false),
      reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
    }
  );

  return setMessageId(message, result.message_id);
});

Telegram.out('animation', async function(message) {
  const options = this.getOptions();
  const connector = options.connector;
  const param = params(message);

  const result = await connector.sendAnimation(
    message.payload.chatId,
    message.payload.content,
    {
      disable_notification: param('silent', false),
      reply_to_message_id: param('replyToMessage', false) ? getMessageId(message) : null
    }
  );

  return setMessageId(message, result.message_id);
});

// log messages, these should be the last
Telegram.out(function(message) {
  var options = this.getOptions();
  var logfile = options.logfile;
  var chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        var chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Telegram.in('*', function(message) {
  var options = this.getOptions();
  var logfile = options.logfile;
  var chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        var chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Telegram.mixin({
  downloadFile: function (url, token) {
    return new Promise(function (resolve, reject) {
      var options = {
        url: url,
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };
      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  },
  callbackQuery: function(botMsg) {
    var chatServer = this;
    var options = this.getOptions();
    var connector = options.connector;
    var chatId = botMsg.message.chat.id;
    var alert = false;
    var answer = null;
    if (connector.lastInlineButtons != null && connector.lastInlineButtons[chatId] != null) {
      // find the button with the right value, takes the answer and alert if any
      var button = _(connector.lastInlineButtons[chatId]).findWhere({value: botMsg.data});
      if (button != null) {
        answer = button.answer;
        alert = button.alert;
      }
      // do not remove from hash, the user could click again
    }
    // copy the "from" of the message containing user information, not chatbot detail
    botMsg.message.from = botMsg.from;
    // send answer back to client
    connector.answerCallbackQuery(botMsg.id, { text: answer, show_alert: alert })
      .then(function() {
        // send through the message as usual
        botMsg.message.text = botMsg.data;
        chatServer.receive(botMsg.message);
      });
  }
});

const videoExtensions = ['.mp4', '.gif'];
const audioExtensions = ['.mp3'];
const documentExtensions = ['.pdf', '.gif', '.zip'];
const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

Telegram.registerMessageType('action', 'Action', 'Send an action message (like typing, ...)');
Telegram.registerMessageType('buttons', 'Buttons', 'Open keyboard buttons in the client');
Telegram.registerMessageType('command', 'Command', 'Detect command-like messages');
Telegram.registerMessageType('contact', 'Contact', 'Send a contact');
Telegram.registerMessageType('inline-buttons', 'Inline buttons', 'Send a message with inline buttons');
Telegram.registerMessageType('inline-query', 'Inline Query', 'Receives inline queries');
Telegram.registerMessageType('invoice', 'Invoice', 'Send a payment invoice');
Telegram.registerMessageType('invoice-shipping', 'Invoice Shipping Query', 'Define an invoice shipping option');
Telegram.registerMessageType('location', 'Location', 'Send a map location message');
Telegram.registerMessageType('message', 'Message', 'Send a plain text message');
Telegram.registerMessageType('payment', 'Payment', 'Payment received message');
Telegram.registerMessageType('request', 'Request', 'Trigger a request of location or contact');
Telegram.registerMessageType('sticker', 'Sticker', 'Send a sticker');
Telegram.registerMessageType(
  'animation',
  'Animation',
  'Send an animation',
  file => {
    if (!_.isEmpty(file.extension) && !videoExtensions.includes(file.extension)) {
      return `Unsupported file format for video node "${file.filename}", allowed formats: ${videoExtensions.join(', ')}`;
    }
    if (file.size > (50 * 1024 * 1024)) {
      return 'Video is too large, max 50 Mb';
    }
    return null;
  }
);
Telegram.registerMessageType('event', 'Event', 'Event from platform');
Telegram.registerMessageType(
  'video',
  'Video',
  'Send video message',
  file => {
    if (!_.isEmpty(file.extension) && !videoExtensions.includes(file.extension)) {
      return `Unsupported file format for video node "${file.filename}", allowed formats: ${videoExtensions.join(', ')}`;
    }
    if (file.size > (50 * 1024 * 1024)) {
      return 'Video is too large, max 50 Mb';
    }
    return null;
  }
);
Telegram.registerMessageType('video_note', 'Video Note', 'Video note (short video)');

Telegram.registerMessageType(
  'document',
  'Document',
  'Send a document or generic file',
  file => {
    if (!_.isEmpty(file.extension) && !documentExtensions.includes(file.extension)) {
      return `Unsupported file format for document node "${file.filename}", allowed formats: ${documentExtensions.join(', ')}`;
    }
    return null;
  }
);
Telegram.registerMessageType(
  'audio',
  'Audio',
  'Send an audio message',
  file => {
    if (!_.isEmpty(file.extension) && !audioExtensions.includes(file.extension)) {
      return `Unsupported file format for audio node "${file.filename}", allowed formats: ${audioExtensions.join(', ')}`;
    }
    return null;
  }
);
Telegram.registerMessageType(
  'photo',
  'Photo',
  'Send a photo message',
  file => {
    if (!_.isEmpty(file.extension) && !photoExtensions.includes(file.extension)) {
      return `Unsupported file format for image node "${file.filename}", allowed formats: ${photoExtensions.join(', ')}`;
    }
  }
);

Telegram.registerParam(
  'replyToMessage',
  'boolean',
  { label: 'Reply to message', default: false }
);
Telegram.registerParam(
  'silent',
  'boolean',
  { label: 'Silent', default: false, description: 'Deliver the message silently' }
);
Telegram.registerParam(
  'modifyMessageId',
  'string',
  {
    label: 'Modify message',
    description: 'The id of the sent message to be modified',
    placeholder: 'Message Id',
    suggestions: [
      '{{outboundMessageId}}',
      '{{inboundMessageId}}'
    ]
  }
);
Telegram.registerParam(
  'parseMode',
  'select',
  {
    label: 'Parse Mode',
    default: 'Markdown',
    description: 'Parse message with HTML or Markdown',
    placeholder: 'Parse mode',
    options: [
      { value: '', label: 'Select parse mode'},
      { value: 'Markdown', label: 'Markdown'},
      { value: 'HTML', label: 'HTML' }
    ]
  }
);
Telegram.registerParam(
  'disableWebPagePreview',
  'boolean',
  { label: 'Disable web page preview', description: 'Disables link previews for links in this message' }
);
Telegram.registerParam(
  'deleteMessageId',
  'string',
  {
    label: 'Delete Message',
    description: 'Delete a message given the message id',
    placeholder: 'Message Id',
    suggestions: [
      '{{outboundMessageId}}',
      '{{inboundMessageId}}'
    ]
  }
);

Telegram.registerEvent('new-user', 'New user');

module.exports = Telegram;
