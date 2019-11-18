const _ = require('underscore');
const qs = require('querystring');
const url = require('url');
const moment = require('moment');
const { ChatExpress, ChatLog } = require('chat-platform');
const request = require('request').defaults({ encoding: null });
const utils = require('../../helpers/utils');
const when = utils.when;

/*
  Useful links
  Reference - https://docs.microsoft.com/en-us/javascript/api/botbuilder/index?view=botbuilder-ts-latest

*/

const {
  TurnContext,
  MessageFactory,
  TeamsInfo,
  TeamsActivityHandler,
  CardFactory,
  CardAction,
  ActionTypes,
  BotFrameworkAdapter
} = require('botbuilder');




const MicrosoftTeams = new ChatExpress({
  transport: 'msteams',
  transportDescription: 'Microsoft Teams',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    const { activity } = payload;
    //const activity = context != null ? context.activity : null;
    //console.log('payloadf chat id', context.activity)
    return activity != null && activity.from != null ? activity.from.id : null; 
  },
  userIdKey: function(payload) {
    const { activity } = payload;
    //const activity = context != null ? context.activity : null;
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
  /*multiWebHook: true,
  webHookScheme: function() {
    const { token } = this.getOptions();
    return token != null ? token.substr(0,10) : null;
  },*/
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
    '/redbot/msteams': 'Use this in the "Webhooks" section of the Facebook App ("Edit Subscription" button)',
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
  const { originalMessage: { context, activity }} = message;
  const chatContext = message.chat();

  // TODO: store message id

  if (activity.type === 'message' && activity.text != null) {
    message.payload.content = activity.text;
    message.payload.type = 'message';
    
    return when(chatContext.set('message', message.payload.content))
      .then(() => message);
  }


  return message;
});

MicrosoftTeams.out('message', function(message) {
  const chatServer = this;
  const context = message.chat();

  return this.sendActivity(message, message.payload.content)
    .then(result => console.log('message id', result.id));
});


/*
  Reference:
  https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-add-media-attachments?view=azure-bot-service-4.0&tabs=javascript
*/
MicrosoftTeams.out('photo', function(message) {
  const chatServer = this;
  const context = message.chat();
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
  var options = this.getOptions();
  var connector = options.connector;
  var parseMode = options.parseMode != null ? options.parseMode : null;
  var chatServer = this;
  var context = message.chat();

  // https://docs.microsoft.com/en-us/javascript/api/botframework-schema/cardaction?view=botbuilder-ts-latest
  

  const card = CardFactory.heroCard(
    'White T-Shirt',
    ['https://example.com/whiteShirt.jpg'],
    [
      {
        //displayText: 'The Button',
        value: 'thebutton',
        type: 'postBack',
        text: 'I am a text', // il valore che viene mandato
        title: 'I am a title' // label del botton
      },
      {
        "type": "openUrl",
        "title": "Tabs in Teams",
        "value": "https://msdn.microsoft.com/en-us/microsoft-teams/tabs"
    }
    ]
);
  const activity = MessageFactory.attachment(card);

  return this.sendActivity(message, activity);
});

MicrosoftTeams.registerMessageType('message', 'Message', 'Send a plain text message');
MicrosoftTeams.registerMessageType('photo', 'Photo', 'Send a photo message');
MicrosoftTeams.registerMessageType('inline-buttons',  'Inline buttons', 'Send a message with inline buttons');

module.exports = MicrosoftTeams;
