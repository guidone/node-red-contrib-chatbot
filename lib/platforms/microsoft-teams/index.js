const _ = require('underscore');
const moment = require('moment');
const { ChatExpress, ChatLog } = require('chat-platform');
const utils = require('../../helpers/utils');
const when = utils.when;

const translateButton = require('./helpers/translate-button');

/*
  Useful links
  Reference - https://docs.microsoft.com/en-us/javascript/api/botbuilder/index?view=botbuilder-ts-latest

*/

const {
  //TurnContext,
  MessageFactory,
  //TeamsInfo,
  //TeamsActivityHandler,
  CardFactory,
  //CardAction,
  //ActionTypes,
  BotFrameworkAdapter
} = require('botbuilder');

const MicrosoftTeams = new ChatExpress({
  transport: 'msteams',
  transportDescription: 'Microsoft Teams',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    const { activity } = payload;
    return activity != null && activity.from != null ? activity.from.id : null;
  },
  userIdKey: function(payload) {
    const { activity } = payload;
    return activity != null && activity.recipient != null ? activity.recipient.id : null;
  },
  tsKey: function(payload) {
    return moment.unix(payload.timestamp / 1000);
  },
  type: function() {
    // todo remove this
  },
  onStart: function() {
    const { appId, appPassword } = this.getOptions();
    this.connector = new BotFrameworkAdapter({ appId, appPassword });
    return true;
  },
  events: {},
  routes: {
    '/redbot/msteams/test': function(req, res) {
      res.send('ok');
    },
    '/redbot/msteams': async function(req, res) {
      /*
        Hello Microsoft, we meet again.
        This is an example of an API interface with all bells and whistels JavaScript can offer but that is actually a
        pain in the ass for the devs. The canonical way of answering to a msteams bot is
        processActivity(req, res, async context => {
          await context.sendActivity(`Hello world!!!!!`);
        })
        the only way to send back a message is using this "context" (a fancy object with proxies) that is destroyed the moment
        processActivity ends, this prevents sending any message outside the scope of this function.
        This is the reason req and res are stored - inefficiently - then in the sender are passed again to processActivity in order
        to get another context and be able to send the message (after all the computation of the nodes of Node-RED)
      */
      const activity = await this.getActivity(req, res);
      this.receive({
        activity,
        getResponse: () => [req, res]
      });
    }
  },
  routesDescription: {
    '/redbot/msteams': 'Set this in the MSTeams manifest editor',
    '/redbot/msteams/test': 'Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"'
  }
});

MicrosoftTeams.mixin({
  sendActivity(message, activity) {
    const [req, res] = message.originalMessage.getResponse();
    return new Promise((resolve, reject) => {
      this.connector.processActivity(req, res, async (context) => {
        try {
          const result = await context.sendActivity(activity);
          resolve(result);
        } catch(e) {
          reject(e);
        }
      });
    });
  },
  getActivity(req, res) {
    return new Promise(resolve => {
      this.connector.processActivity(req, res, async context => resolve(context.activity));
    });
  }
});

MicrosoftTeams.in(function(message) {
  const { originalMessage: { activity }} = message;

  if (activity.type === 'message' && activity.text != null) {
    message.payload.content = activity.text;
    message.payload.type = 'message';
  }

  return message;
});

MicrosoftTeams.out('message', function(message) {
  const context = message.chat();
  return this.sendActivity(message, message.payload.content)
    .then(result => context.set('messageId', result.id));
});

/*
  Reference:
  https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-add-media-attachments?view=azure-bot-service-4.0&tabs=javascript
*/
MicrosoftTeams.out('photo', function(message) {
  const base64 = message.payload.content.toString('base64');
  const activity = MessageFactory.contentUrl(
    `data:image/png;base64,${base64}`,
    message.payload.mimeType,
    '',
    message.payload.caption
  );
  return this.sendActivity(message, activity);
});

MicrosoftTeams.out('inline-buttons', function(message) {

  // https://docs.microsoft.com/en-us/javascript/api/botframework-schema/cardaction?view=botbuilder-ts-latest
  const card = CardFactory.heroCard(
    message.payload.content,
    // put transparent image
    ['data:image/png;base64;iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='],
    message.payload.buttons.map(translateButton)
  );
  const activity = MessageFactory.attachment(card);

  return this.sendActivity(message, activity);
});

// log messages, these should be the last
MicrosoftTeams.out(function(message) {
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

MicrosoftTeams.in('*', function(message) {
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

MicrosoftTeams.registerMessageType('message', 'Message', 'Send a plain text message');
MicrosoftTeams.registerMessageType('photo', 'Photo', 'Send a photo message');
MicrosoftTeams.registerMessageType('inline-buttons',  'Inline buttons', 'Send a message with inline buttons');

module.exports = MicrosoftTeams;
