var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var DiscordJS = require('discord.js');


var request = require('request').defaults({ encoding: null });
var ChatLog = require('../chat-log');
var utils = require('../../lib/helpers/utils');
var when = utils.when;

/*

- Send a message, upload file: https://slackapi.github.io/node-slack-sdk/web_api#posting-a-message


*/

var Discord = new ChatExpress({
  transport: 'discord',
  transportDescription: 'Discord',
  chatIdKey: function(payload) {
    return payload.discordMessage.channel != null ? payload.discordMessage.channel.id : null
  },
  userIdKey: function(payload) {
    return payload.discordMessage.author != null ? payload.discordMessage.author.id : null
  },
  tsKey: function(payload) {
    return moment.unix(payload.discordMessage.createdTimestamp);
  },
  type: function(payload) {
    var type = null;
    // convert message type
    if (payload.discordMessage.type === 'DEFAULT') {
      type = 'message';
    }
    return type;
  },
  onStop: function() {
    var options = this.getOptions();
    //options.connector.disconnect();
    return options.connector.destroy();
  },
  onStart: function() {
    var chatServer = this;
    var options = this.getOptions();


    options.connector = new DiscordJS.Client();


    options.connector.on('message', function(message) {
      console.log('---is function', _.isFunction(message.reply));
      // skip if it's from the bot
      if (message.author.bot) {
        return;
      }

      chatServer.receive({ discordMessage: message });
    });
    return options.connector.login('NTI3ODg0NzYzMTE4NDM2MzUz.DwaOrw.GjuyPZ8N9ZmEKm5poOaylbIQHKw');
  },
  routes: {

  },
  routesDescription: {

  }
});



Discord.in('message', function(message) {
  var chatContext = message.chat();
  var discordMessage = message.originalMessage.discordMessage;
  console.log('handling tpye message');
  return new Promise(function(resolve, reject) {
    message.payload.content = discordMessage.content;

    when(chatContext.set('message', message.payload.content))
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });
});

Discord.out('message', function(message) {
  console.log('--->>>>>>>>', message.originalMessage);
  var discordMessage = message.originalMessage.discordMessage;
  return discordMessage.reply(message.payload.content);
});


Discord.registerMessageType('message', 'Message', 'Send a plain text message');

module.exports = Discord;





