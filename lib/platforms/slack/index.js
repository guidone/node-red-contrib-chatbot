const _ = require('underscore');
const moment = require('moment');
const { ChatExpress, ChatLog } = require('chat-platform');
const request = require('request').defaults({ encoding: null });
const { App } = require('@slack/bolt');

const lcd = require('../../helpers/lcd');
const { when, params } = require('../../helpers/utils');


/*
  BOLT DOCUMENTATION: https://slack.dev/bolt-js/concepts
*/

/*
YAML file to start a bot with WS support

display_information:
  name: Guidone
features:
  app_home:
    home_tab_enabled: false
    messages_tab_enabled: true
    messages_tab_read_only_enabled: false
  bot_user:
    display_name: Guidone
    always_online: true
oauth_config:
  scopes:
    bot:
      - channels:history
      - channels:join
      - commands
      - chat:write
      - im:history
      - users:write
      - files:read
      - files:write
settings:
  event_subscriptions:
    bot_events:
      - message.channels
      - message.im
  interactivity:
    is_enabled: true
  org_deploy_enabled: false
  socket_mode_enabled: true
  is_hosted: false
  token_rotation_enabled: false
*/

/*
YAML

display_information:
  name: MySlack WebHook
features:
  app_home:
    home_tab_enabled: false
    messages_tab_enabled: true
    messages_tab_read_only_enabled: false
  bot_user:
    display_name: MySlack WebHook
    always_online: true
oauth_config:
  scopes:
    bot:
      - channels:history
      - channels:join
      - chat:write
      - commands
      - files:read
      - files:write
      - im:history
      - users:write
      - chat:write.customize
settings:
  event_subscriptions:
    request_url: https://123456.ngrok.io/slack/events
    bot_events:
      - message.channels
      - message.im
  interactivity:
    is_enabled: true
    request_url: https://123456.ngrok.io/slack/events
  org_deploy_enabled: false
  socket_mode_enabled: false
  token_rotation_enabled: false


*/

// set the messageId in a returning payload
const setMessageId = (message, messageId) => ({
  ...message,
  payload: {
    ...message.payload,
    messageId
  }
});

const escapeSlackCommands = text => {
  if (typeof text === 'string' && text.startsWith('//')) {
    return text.replace('//', '/');
  }
  return text;
};

const parseActions = actions => {
  const result = {};
  actions.forEach(action => {
    switch(action.type) {
      case 'button':
        result[action.block_id] = action.value;
        break;
      case 'overflow':
      case 'static_select':
        result[action.block_id] = action.selected_option.value;
        break;
      case 'multi_static_select':
        result[action.block_id] = action.selected_options.map(option => option.value);
        break;
    }
  })
  return result;
}

const parseChannel = event => {
  // not sure if channel_ids is still used in slack event payloads
  if (_.isArray(event.channel_ids) && !_.isEmpty(event.channel_ids)) {
    return event.channel_ids[0];
  } else if (event.channel ) {
    return event.channel;
  }
  else {
    return null
  }
};

const boltMiddleware = (chatServer) => {
  return async function({ next, body: payload, client, ack }) {
    // skip if empty
    if (payload == null) {
      next();
      return;
    }
    if (!_.isEmpty(payload.command)) {
      await ack();
      chatServer.receive({
        ...payload,
        type: 'command',
        channel: payload.channel_id,
        user: payload.user_id,
        channel_id: undefined,
        user_id: undefined
      });
      next();
    } else if (payload.type === 'event_callback' && payload.event.type === 'message') {
      chatServer.receive({
        ...payload.event,
        text: escapeSlackCommands(payload.event.text),
        ts: moment.unix(payload.event.ts),
      });
    } else if (payload != null && payload.type === 'interactive_message' && payload.actions[0].value.indexOf('dialog_') !== -1) {
      ack();
      // if it's the callback of a dialog button, then relay a dialog message
      chatServer.receive({
        type: 'dialog',
        channel: payload.channel.id,
        user: payload.user.id,
        text: payload.actions[0].value.replace('dialog_', ''),
        ts: moment.unix(payload.action_ts),
        trigger_id: payload.trigger_id,
        callback_id: payload.callback_id
      });
      // if there's feedback, send it back, otherwise do nothing
      if (!_.isEmpty(chatServer.getButtonFeedback(payload.actions[0].name))) {
        client.chat.postEphemeral({
          channel: payload.channel.id,
          user: payload.user.id,
          text: chatServer.getButtonFeedback(payload.actions[0].name)
        });
      } else {
        next();
      }
    } else if (payload != null && payload.type === 'interactive_message') {
      ack();
      // relay a message with the value of the button
      chatServer.receive({
        type: 'message',
        channel: payload.channel.id,
        user: payload.user.id,
        text: payload.actions[0].value,
        ts: moment.unix(payload.action_ts),
        trigger_id: payload.trigger_id,
        callback_id: payload.callback_id
      });
      // if there's feedback, send it back, otherwise do nothing
      if (!_.isEmpty(chatServer.getButtonFeedback(payload.actions[0].name))) {
        client.chat.postEphemeral({
          channel: payload.channel.id,
          user: payload.user.id,
          text: chatServer.getButtonFeedback(payload.actions[0].name)
        });
      } else {
        next();
      }
    } else if (payload.type === 'dialog_submission') {
      ack();
      // intercept a dialog response and relay
      chatServer.receive({
        type: 'response',
        channel: payload.channel.id,
        user: payload.user.id,
        response: payload.submission,
        ts: moment.unix(payload.action_ts),
        trigger_id: payload.trigger_id,
        callback_id: payload.callback_id
      });
      next();
    } else if (payload.type === 'block_actions') {
      ack();
      chatServer.receive({
        type: 'response',
        channel: payload.channel.id,
        user: payload.user.id,
        response: parseActions(payload.actions),
        actions: payload.actions,
        ts: moment.unix(payload.action_ts),
        trigger_id: payload.trigger_id,
        callback_id: payload.callback_id
      });
      next();
    } else if (payload.type === 'event_callback') {
      chatServer.receive({
        type: 'event',
        channel: parseChannel(payload.event),
        eventPayload: _.omit(payload.event, 'type'),
        eventType: payload.event.type
      });
      next();
    } else {
      next();
    }
  };
}

const Slack = new ChatExpress({
  transport: 'slack',
  transportDescription: 'Slack',
  color: '#39143e',
  chatIdKey: 'channel',
  userIdKey: 'user',
  messageIdKey: function(payload) {
    return payload.event_ts;
  },
  tsKey: function(payload) {
    return moment.unix(payload.ts);
  },
  type: function(payload) {
    let type = payload.type;
    // get mime if any file
    const fileMimeType = _.isArray(payload.files) && !_.isEmpty(payload.files) ? payload.files[0].mimetype : null;
    // convert message type
    if (fileMimeType != null && fileMimeType.indexOf('image') !== -1) {
      type = 'photo';
    } else if (fileMimeType != null && fileMimeType.indexOf('audio') !== -1) {
      type = 'audio';
    } else if (fileMimeType != null && fileMimeType.indexOf('video') !== -1) {
      type = 'video';
    } else if (fileMimeType != null) {
      type = 'document';
    } else if (!_.isEmpty(payload.subtype)) {
      // slack uses a taxonomy with type and subtype, basically everything is a "message"
      type = payload.subtype;
    }
    return type;
  },
  onStop: async function() {
    if (this.server != null) {
      await this.server.stop();
    }
    return true;
  },
  onStart: async function() {
    const chatServer = this;
    const options = this.getOptions();
    const serverPort = !_.isEmpty(options.serverPort) && !isNaN(parseInt(options.serverPort, 10)) ?
      parseInt(options.serverPort, 10) : 3001;
    // create listening server
    chatServer.server = new App({
      token: options.token,
      signingSecret: options.signingSecret,
      socketMode: options.useWebSocket,
      appToken: options.appToken,
      port: serverPort
    });
    options.client = chatServer.server.client;
    chatServer.server.use(boltMiddleware(chatServer));
    await chatServer.server.start(serverPort)

    // show endpoints if not using web sockets
    if (!options.useWebSocket) {
      // eslint-disable-next-line no-console
      console.log(lcd.grey('------ WebHooks for SLACK ----------------'));
      // eslint-disable-next-line no-console
      console.log(lcd.green(`http://localhost:${serverPort}/events`)
        + lcd.grey(' - ')
        + lcd.white('Callback for events')
      );
      // eslint-disable-next-line no-console
      console.log(lcd.green(`http://localhost:${serverPort}/interactions`)
        + lcd.grey(' - ')
        + lcd.white('Callback for interactions (postback, dialogs, etc)')
      );
      // eslint-disable-next-line no-console
      console.log(lcd.green(`http://localhost:${serverPort}/commands`)
        + lcd.grey(' - ')
        + lcd.white('Callback for commands')
      );
      // eslint-disable-next-line no-console
      console.log(lcd.green(`http://localhost:${serverPort}/test`)
        + lcd.grey(' - ')
        + lcd.white('Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"')
      );
      // eslint-disable-next-line no-console
      console.log('');
    }
  }
});

Slack.in(async function(message) {
  // cleanup the payload
  delete message.payload.source_team;
  delete message.payload.team;

  // todo check if necessary
  // echo after a button is clicked, discard
  if (message.originalMessage.subtype === 'message_changed') {
    return;
  }

  return message;
});

Slack.in(function(message) {
  var options = this.getOptions();
  var authorizedUsernames = (options.authorizedUsernames || '').split(',');
  // check if it's in the list of authorized users
  if (!_.isEmpty(authorizedUsernames)) {
    if (_(authorizedUsernames).contains(String(message.payload.userId))) {
      return new Promise(function(resolve, reject) {
        return when(message.chat().set('authorized', true))
          .then(function() {
            resolve(message);
          }, reject);
      });
    }
  }
  return message;
});

Slack.in(function(message) {
  const originalMessage = message.originalMessage;
  if (originalMessage.type === 'event') {
    message.payload = {
      type: 'event',
      eventType: originalMessage.eventType,
      ...originalMessage.eventPayload
    };
  }
  return when(message);
});

Slack.in('command', async function(message) {
  if (_.isString(message.originalMessage.text) && !_.isEmpty(message.originalMessage.text)) {
    message.payload.content = message.originalMessage.command;
    message.payload.type = 'command';
    message.payload.arguments = !_.isEmpty(message.originalMessage.text) ?
      message.originalMessage.text.split(' ') : [];
  }
  return message;
});

Slack.in('message', function(message) {
  return new Promise(function(resolve) {
    message.payload.content = message.originalMessage.text;
    delete message.payload.text;
    resolve(message);
  });
});

Slack.in('dialog', function(message) {
  message.payload.content = message.originalMessage.text;
  return message;
});

Slack.in('response', function(message) {
  message.payload.content = message.originalMessage.response;
  return message;
});

Slack.out('dialog', async function(message) {
  const options = this.getOptions();
  const client = options.client;

  // map some element in order to change var conventions
  const elements = _(message.payload.elements)
    .map(function(item) {
      var element = _.clone(item);
      element.max_length = element.maxLength;
      element.min_length = element.minLength;
      delete element.minLength;
      delete element.maxLength;
      return element;
    });

  const dialog = {
    callback_id: message.originalMessage.callback_id,
    title: message.payload.title,
    submit_label: message.payload.submitLabel,
    elements: elements
  };

  await client.dialog.open({ dialog: JSON.stringify(dialog), trigger_id: message.originalMessage.trigger_id })
  return message;
});

Slack.out(async function(message) {
  const options = this.getOptions();
  const client = options.client;
  const param = params(message);
  const deleteMessageId = param('deleteMessageId');

  if (deleteMessageId) {
    await client.chat.delete({
      channel: message.payload.chatId,
      ts: deleteMessageId
    });
    message.payload = {};
  }
  return message;
});

Slack.out('message', async function(message) {
  const options = this.getOptions();
  const slackExtensions = this.getSlackExtensions(message);
  const chatContext = message.chat();
  const client = options.client;
  const param = params(message);

  const payload = Object.assign({
    channel: message.payload.chatId,
    text: message.payload.content,
    mrkdwn: param('markdown', undefined),
    // send to the right thread if present
    thread_ts: !_.isEmpty(message.originalMessage.thread_ts) ?
      message.originalMessage.thread_ts : undefined
  }, slackExtensions);

  const res = await client.chat.postMessage(payload);
  await when(chatContext.set({
    messageId: res.ts,
    outboundMessageId: res.ts
  }));
  return setMessageId(message, res.ts);
});

Slack.out('blocks', async function(message) {
  const options = this.getOptions();
  const slackExtensions = this.getSlackExtensions(message);
  const chatContext = message.chat();

  const client = options.client;
  const payload = Object.assign({
    channel: message.payload.chatId,
    text: message.payload.text,
    blocks: message.payload.content
  }, slackExtensions);
  const res = await client.chat.postMessage(payload)
  await when(chatContext.set({
    messageId: res.ts,
    outboundMessageId: res.ts
  }));
  return setMessageId(message, res.ts);
});

Slack.out('location', async function(message) {
  const options = this.getOptions();
  const slackExtensions = this.getSlackExtensions(message);
  const chatContext = message.chat();
  const client = options.client;
  // build map link
  const link = 'https://www.google.com/maps?f=q&q=' + message.payload.content.latitude + ','
    + message.payload.content.longitude + '&z=16';
  // send simple attachment
  const attachments = [
    {
      'author_name': !_.isEmpty(message.payload.place) ? message.payload.place : 'Position',
      'title': link,
      'title_link': link,
      'color': '#7CD197'
    }
  ];
  const payload = Object.assign({
    channel: message.payload.chatId,
    text: '',
    attachments: attachments
  }, slackExtensions);
  const res = await client.chat.postMessage(payload)
  await when(chatContext.set({
    messageId: res.ts,
    outboundMessageId: res.ts
  }));
  return setMessageId(message, res.ts);
});

Slack.out('action', function(message) {
  var connector = this.getConnector();
  return new Promise(function(resolve) {
    connector.sendTyping(message.payload.chatId);
    resolve(message);
  });
});


Slack.in('photo', function(message) {
  var chatServer = this;
  var url = message.originalMessage.files[0].url_private_download;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(url)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function(e) {
          reject('Photo Error: ' + e);
        });
  });
});

Slack.out('photo', async function(message) {
  const chatServer = this;
  const chatContext = message.chat();

  const res = await chatServer.sendBuffer(
    message.payload.chatId,
    message.payload.content,
    message.payload.filename,
    message.payload.caption
  );
  await when(chatContext.set({
    messageId: res.ts,
    outboundMessageId: res.ts
  }));
  return setMessageId(message, res.ts);
});

Slack.in('document', function(message) {
  var chatServer = this;
  var url = message.originalMessage.files[0].url_private_download;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(url)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function(e) {
          reject('Document Error: ' + e)
        });
  });
});

Slack.out('document', async function(message) {
  const chatServer = this;
  const chatContext = message.chat();

  const res = await chatServer.sendBuffer(
    message.payload.chatId,
    message.payload.content,
    message.payload.filename,
    message.payload.caption
  );
  await when(chatContext.set({
    messageId: res.ts,
    outboundMessageId: res.ts
  }));
  return setMessageId(message, res.ts);
});

Slack.in('audio', function(message) {
  var chatServer = this;
  var url = message.originalMessage.files[0].url_private_download;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(url)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function(e) {
          reject('Audio Error: ' + e)
        });
  });
});

Slack.out('audio', async function(message) {
  const chatServer = this;
  const chatContext = message.chat();

  const res = await chatServer.sendBuffer(
    message.payload.chatId,
    message.payload.content,
    message.payload.filename,
    message.payload.caption
  );
  await when(chatContext.set({
    messageId: res.ts,
    outboundMessageId: res.ts
  }));
  return setMessageId(message, res.ts);
});

Slack.in('video', function(message) {
  var chatServer = this;
  var url = message.originalMessage.files[0].url_private_download;
  return new Promise(function(resolve, reject) {
    chatServer.downloadUrl(url)
      .then(
        function(body) {
          message.payload.content = body;
          resolve(message);
        },
        function(e) {
          reject('Video Error: ' + e)
        });
  });
});

Slack.out('video', async function(message) {
  const chatServer = this;
  const chatContext = message.chat();

  const res = await chatServer.sendBuffer(
    message.payload.chatId,
    message.payload.content,
    message.payload.filename,
    message.payload.caption
  );
  await when(chatContext.set({
    messageId: res.ts,
    outboundMessageId: res.ts
  }));
  return setMessageId(message, res.ts);
});

Slack.out('inline-buttons', async function(message) {
  const options = this.getOptions();
  const slackExtensions = this.getSlackExtensions(message);
  const chatServer = this;
  const chatContext = message.chat();

  const client = options.client;
  let payload = {
    channel: message.payload.chatId,
    text: message.payload.content,
    attachments: [
      {
        'text': message.payload.content,
        callback_id: !_.isEmpty(message.payload.name) ? message.payload.name : _.uniqueId('callback_'),
        color: '#3AA3E3',
        attachment_type: 'default',
        actions: chatServer.parseButtons(message.payload.buttons)
      }
    ]
  };
  payload = Object.assign(payload, slackExtensions);
  const res = await client.chat.postMessage(payload)
  await chatContext.set('messageId', res.ts);
  return setMessageId(message, res.ts);
});

// todo classes only when selected

Slack.out('generic-template', async function(message) {
  const chatServer = this;
  const options = this.getOptions();
  const chatContext = message.chat();
  const slackExtensions = this.getSlackExtensions(message);

  const client = options.client;
  const attachments = _(message.payload.elements).map(function(item) {
    var attachment = {
      title: item.title,
      callback_id: !_.isEmpty(item.title) ? item.title : _.uniqueId('callback_'),
      actions: chatServer.parseButtons(item.buttons)
    };
    if (!_.isEmpty(item.subtitle)) {
      attachment.text = item.subtitle;
    }
    if (!_.isEmpty(item.imageUrl)) {
      attachment.image_url = item.imageUrl;
    }
    return attachment;
  });

  let payload = {
    channel: message.payload.chatId,
    text: message.payload.content,
    attachments: attachments
  };
  payload = Object.assign(payload, slackExtensions);

  const res = await client.chat.postMessage(payload)
  await chatContext.set('messageId', res.ts);
  return setMessageId(message, res.ts);
});

// log messages, these should be the last
Slack.out(function(message) {
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

Slack.in('*', function(message) {
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

Slack.mixin({

  getSlackExtensions: function(message) {
    const param = params(message);

    const slackExtensions = {};
    if (!_.isEmpty(param('username'))) {
      slackExtensions.username = param('username');
      // it breaks, it should be added as per documentation
      //slackExtensions.as_user = false;
    }
    if (!_.isEmpty(param('icon_emoji'))) {
      slackExtensions.icon_emoji = param('icon_emoji');
    }

    return slackExtensions;
  },

  parseButtons: function(buttons) {
    var chatServer = this;
    return _(buttons)
      .chain()
      .filter(function(button) {
        return button.type === 'postback' || button.type === 'dialog';
      })
      .map(function(button) {
        var name = button.value || button.label;
        if (!_.isEmpty(button.answer)) {
          chatServer.setButtonFeedback(name, button.answer);
        }
        // if the button is dialog, then prefix the "dialog_" to trigger a dialog message
        var value = button.value || button.label;
        if (button.type === 'dialog') {
          value = 'dialog_' + value;
        }
        return {
          name: name,
          text: button.label || button.value,
          value: value,
          type: 'button',
          style: !_.isEmpty(button.style) ? button.style : 'default'
        };
      })
      .value();
  },
  downloadUrl: function(url) {
    var node_options = this.getOptions();
    return new Promise(function(resolve, reject) {
      // In order to retried private files a valid OAuth token must be
      // provided on the Bearer Authorization.  The current slack code parses out
      // url_private_download into the url variable.
      if (!_.isEmpty(node_options.token)) {
        var options = {
          url: url,
          headers : {
            'Authorization': 'Bearer ' + node_options.token,
          }
        };
        request(options, function(error, response, body) {
          if (error) {
            reject('Unable to download file ' + url);
          } else {
            resolve(body);
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(lcd.error('The Slack bot configuration has no OAuth token.'));
        // eslint-disable-next-line no-console
        console.log(lcd.grey(
          'In order to upload binaries from the Slack client, a OAuth token must be provided, get the token in the'
          + '"OAuth & Permission" section in https://api.slack.com'
        ));
        reject('No OAuth Token configured. Check');
      }
    });
  },
  // eslint-disable-next-line max-params
  sendBuffer: function(chatId, buffer, filename, caption) {
    var options = this.getOptions();
    var client = options.client;

    filename = !_.isEmpty(filename) ? filename : _.uniqueId('tmp_file_');

    return client.files
      .upload({
        filename: filename,
        file: buffer,
        filetype: 'auto',
        title: caption,
        channels: chatId
      });
  },
  setButtonFeedback: function(name, message) {
    if (this._buttonFeedbacks == null) {
      this._buttonFeedbacks = {};
    }
    this._buttonFeedbacks[name] = message;
  },
  getButtonFeedback: function(name) {
    return this._buttonFeedbacks != null ? this._buttonFeedbacks[name] : null;
  },
  /**
   * @method parsePayload
   * Parse an incoming message after an interactive message
   * https://api.slack.com/interactive-messages#responding
   */
  parsePayload: function(message) {
    var obj = null;
    try {
      obj = JSON.parse(message.payload);
    } catch(e) {
      // do nothing
    }
    return obj;
  }
});

const videoExtensions = ['.mp4'];
const audioExtensions = ['.mp3'];
const documentExtensions = ['.pdf', '.zip'];
const photoExtensions = ['.jpg', '.jpeg', '.png', '.gif'];

Slack.registerMessageType('generic-template', 'Generic Template', 'Facebook like generic template');
Slack.registerMessageType('action', 'Action', 'Send an action message (like typing, ...)');
Slack.registerMessageType('dialog', 'Dialog', 'Open a dialog form');
Slack.registerMessageType('inline-buttons', 'Inline buttons', 'Send a message with inline buttons');
Slack.registerMessageType('location', 'Location', 'Send a map location message');
Slack.registerMessageType('message', 'Message', 'Send a plain text message');
Slack.registerMessageType('blocks', 'Blocks', 'Send message as blocks (Slack Block Kit)');
Slack.registerMessageType('response', 'Response', 'Dialog or Block Kit response');
Slack.registerMessageType(
  'video',
  'Video',
  'Send video message',
  file => {
    if (!_.isEmpty(file.extension) && !videoExtensions.includes(file.extension)) {
      return `Unsupported file format for video node "${file.filename}", allowed formats: ${videoExtensions.join(', ')}`;
    }
    return null;
  }
);
Slack.registerMessageType(
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
Slack.registerMessageType(
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
Slack.registerMessageType(
  'photo',
  'Photo',
  'Send a photo message',
  file => {
    if (!_.isEmpty(file.extension) && !photoExtensions.includes(file.extension)) {
      return `Unsupported file format for image node "${file.filename}", allowed formats: ${photoExtensions.join(', ')}`;
    }
  }
);

Slack.registerEvent('file_deleted', 'A file was deleted');
Slack.registerEvent('app_home_opened', 'User clicked into your App Home');
Slack.registerEvent('app_mention','Subscribe to only the message events that mention your app or bot');
Slack.registerEvent('app_rate_limited','Indicates your app\'s event subscriptions are being rate limited');
Slack.registerEvent('app_requested','User requested an app');
Slack.registerEvent('app_uninstalled', 'Your Slack app was uninstalled');
Slack.registerEvent('call_rejected', 'A call was rejected');
Slack.registerEvent('channel_archive', 'A channel was archived');
Slack.registerEvent('channel_created', 'A channel was created');
Slack.registerEvent('channel_deleted', 'A channel was deleted');
Slack.registerEvent('channel_history_changed', 'Bulk updates were made to a channel\'s history');
Slack.registerEvent('channel_left', 'You left a channel');
Slack.registerEvent('channel_rename', 'A channel was renamed');
Slack.registerEvent('channel_shared', 'A channel has been shared with an external workspace');
Slack.registerEvent('channel_unarchive', 'A channel was unarchived');
Slack.registerEvent('channel_unshared', 'A channel has been unshared with an external workspace');
Slack.registerEvent('dnd_updated', 'Do not Disturb settings changed for the current user');
Slack.registerEvent('dnd_updated_user', 'Do not Disturb settings changed for a member');
Slack.registerEvent('email_domain_changed', 'The workspace email domain has changed');
Slack.registerEvent('emoji_changed', 'A custom emoji has been added or changed');
Slack.registerEvent('file_change', 'A file was changed');
Slack.registerEvent('file_comment_added', 'A file comment was added');
Slack.registerEvent('file_comment_deleted', 'A file comment was deleted');
Slack.registerEvent('file_comment_edited', 'A file comment was edited');
Slack.registerEvent('file_created', 'A file was created');
Slack.registerEvent('file_deleted', 'A file was deleted');
Slack.registerEvent('file_public', 'A file was made public');
Slack.registerEvent('file_shared', 'A file was shared');
Slack.registerEvent('file_unshared', 'A file was unshared');
Slack.registerEvent('grid_migration_finished', 'An enterprise grid migration has finished on this workspace');
Slack.registerEvent('grid_migration_started', 'An enterprise grid migration has started on this workspace');
Slack.registerEvent('group_archive', 'A private channel was archived');
Slack.registerEvent('group_close', 'You closed a private channel');
Slack.registerEvent('group_deleted', 'A private channel was deleted');
Slack.registerEvent('group_history_changed', 'Bulk updates were made to a private channel\'s history');
Slack.registerEvent('group_left', 'You left a private channel');
Slack.registerEvent('group_open', 'You created a group DM');
Slack.registerEvent('group_rename', 'A private channel was renamed');
Slack.registerEvent('group_unarchive', 'A private channel was unarchived');
Slack.registerEvent('im_close', 'You closed a DM');
Slack.registerEvent('im_created', 'A DM was created');
Slack.registerEvent('im_history_changed', 'Bulk updates were made to a DM\'s history');
Slack.registerEvent('im_open', 'You opened a DM');
Slack.registerEvent('invite_requested', 'User requested an invite');
Slack.registerEvent('link_shared', 'A message was posted containing one or more links relevant to your application');
Slack.registerEvent('member_joined_channel', 'A user joined a public or private channel');
Slack.registerEvent('member_left_channel', 'A user left a public or private channel');
Slack.registerEvent('message', 'A message was sent to a channel');
Slack.registerEvent('message.app_home', 'A user sent a message to your Slack app');
Slack.registerEvent('message.channels', 'A message was posted to a channel');
Slack.registerEvent('message.groups', 'A message was posted to a private channel');
Slack.registerEvent('message.im', 'A message was posted in a direct message channel');
Slack.registerEvent('message.mpim', 'A message was posted in a multiparty direct message channel');
Slack.registerEvent('pin_added', 'A pin was added to a channel');
Slack.registerEvent('pin_removed', 'A pin was removed from a channel');
Slack.registerEvent('reaction_added', 'A member has added an emoji reaction to an item');
Slack.registerEvent('reaction_removed', 'A member removed an emoji reaction');
Slack.registerEvent('resources_added', 'Access to a set of resources was granted for your app');
Slack.registerEvent('resources_removed', 'Access to a set of resources was removed for your app');
Slack.registerEvent('scope_denied', 'OAuth scopes were denied to your app');
Slack.registerEvent('scope_granted', 'OAuth scopes were granted to your app');
Slack.registerEvent('star_added', 'A member has starred an item');
Slack.registerEvent('star_removed', 'A member removed a star');
Slack.registerEvent('subteam_created', 'A User Group has been added to the workspace');
Slack.registerEvent('subteam_members_changed', 'The membership of an existing User Group has changed');
Slack.registerEvent('subteam_self_added', 'You have been added to a User Group');
Slack.registerEvent('subteam_self_removed', 'You have been removed from a User Group');
Slack.registerEvent('subteam_updated', 'An existing User Group has been updated or its members changed');
Slack.registerEvent('team_domain_change', 'The workspace domain has changed');
Slack.registerEvent('team_join', 'A new member has joined');
Slack.registerEvent('team_rename', 'The workspace name has changed');
Slack.registerEvent('tokens_revoked', 'API tokens for your app were revoked');
Slack.registerEvent('url_verification', 'Verifies ownership of an Events API Request URL');
Slack.registerEvent('user_change', 'A member\'s data has changed');
Slack.registerEvent('user_resource_denied', 'User resource was denied to your app');
Slack.registerEvent('user_resource_granted', 'User resource was granted to your app');
Slack.registerEvent('user_resource_removed', 'User resource was removed from your app');

Slack.registerParam(
  'username',
  'string',
  {
    label: 'Username',
    description: 'Override default chatbot username (requires chat:write.customize permission)',
    placeholder: 'username'
  }
);
Slack.registerParam(
  'icon_emoji',
  'string',
  {
    label: 'Icon Emoji',
    description: 'Override default chatbot icon (requires chat:write.customize permission)',
    placeholder: ':+1:'
  }
);
Slack.registerParam(
  'markdown',
  'boolean',
  {
    label: 'Markdown',
    default: true,
    description: 'Render message with Markdown'
  }
);
Slack.registerParam(
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

module.exports = Slack;
