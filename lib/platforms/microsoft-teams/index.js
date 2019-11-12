var _ = require('underscore');
var qs = require('querystring');
var url = require('url');
var moment = require('moment');
var { ChatExpress, ChatLog } = require('chat-platform');

const { BotFrameworkAdapter } = require('botbuilder');

var request = require('request').defaults({ encoding: null });
var utils = require('../../helpers/utils');
var when = utils.when;



const {
  TurnContext,
  MessageFactory,
  TeamsInfo,
  TeamsActivityHandler,
  CardFactory,
  ActionTypes
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
    //this._profiles = {};

    this.connector = new BotFrameworkAdapter({
      appId: '42b7d7cf-885b-4717-b7b7-47fd6fab04cd',
      appPassword: 'APK8q3w7DNVzSb2-:VqELc/:D2V5L2_r'
    });

    return true;
  },
  events: {},
  multiWebHook: true,
  webHookScheme: function() {
    const { token } = this.getOptions();
    return token != null ? token.substr(0,10) : null;
  },
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

  //console.log('check', activity);
  //console.log('check', chatContext);

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

MicrosoftTeams.registerMessageType('message', 'Message', 'Send a plain text message');


module.exports = MicrosoftTeams;
