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
    return payload.sender != null ? payload.sender.id : null;
  },
  userIdKey: function(payload) {
    return payload.sender != null ? payload.sender.id : null;
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
    '/redbot/msteams': function(req, res) {
      
      /*adapter.processActivity(req, res, async (context) => {
        await bot.run(context);
      });*/

      this.connector.processActivity(req, res, async function(context) {
        //await bot.run(context);
        console.log('context---', context.activity)

        await context.sendActivity(`Hello world!!!!!`);
      });

      /*

      { attachments: 
   [ { contentType: 'application/vnd.microsoft.teams.file.download.info',
       content: [Object],
       contentUrl: 'https://redbot918-my.sharepoint.com/personal/admin_redbot918_onmicrosoft_com/Documents/Microsoft Teams Chat Files/test-image.png',
       name: 'test-image.png' } ],
  type: 'message',
  timestamp: 2019-11-08T14:06:52.447Z,
  localTimestamp: 2019-11-08T14:06:52.447Z,
  id: '1573222012378',
  channelId: 'msteams',
  serviceUrl: 'https://smba.trafficmanager.net/emea/',
  from: 
   { id: '29:1mbpGXGet_bWsojEPa62hN74bWzHhoNQ1Thoy5hivb5t6IXiLkt_WFfqW0p9hd2bU7Jd3reh2FuA6R-1EcwNw6w',
     name: 'guido bellomo',
     aadObjectId: '43f95d16-6beb-4d54-958b-ea831dc25190' },
  conversation: 
   { conversationType: 'personal',
     tenantId: 'd6d8c056-5d25-46ab-ad35-719c3498442e',
     id: 'a:1F7OlYFiHN66YerGMouOHzpKHD3G3_ffm2W-A6lxxlNXdd8rK77EUIZAFBhizWJpTvLxgflNHnhSIpzFPbNiHh7OR0dBwDX9v11cZZxWmlpcwl_dFCWxSvlZxfgNRaRSQ' },
  recipient: 
   { id: '28:42b7d7cf-885b-4717-b7b7-47fd6fab04cd',
     name: 'guidone' },
  entities: 
   [ { locale: 'en-US',
       country: 'US',
       platform: 'Web',
       type: 'clientInfo' } ],
  channelData: { tenant: { id: 'd6d8c056-5d25-46ab-ad35-719c3498442e' } },
  locale: 'en-US' }


      */

        
    
    }
  },
  routesDescription: {
    '/redbot/msteams': 'Use this in the "Webhooks" section of the Facebook App ("Edit Subscription" button)',
    '/redbot/msteams/test': 'Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"'
  }
});


MicrosoftTeams.registerMessageType('message', 'Message', 'Send a plain text message');


module.exports = MicrosoftTeams;
