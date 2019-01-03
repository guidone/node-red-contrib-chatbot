var _ = require('underscore');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var DiscordJS = require('discord.js');


//var request = require('request').defaults({ encoding: null });
var ChatLog = require('../chat-log');
var utils = require('../../lib/helpers/utils');
var when = utils.when;

var request = utils.request;
var filenameIsImage = require('../helpers/validators').filenameIsImage;

/*




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


    //console.log('attach', payload.discordMessage.attachments.first());

    /*var imageAttachment = payload.discordMessage.attachments.find(function(attachment) {
      console.log('attach--:::', attachment);
      return filenameIsImage(attachment.filename);
    });*/

    //console.log('image--->', imageAttachment);
    //console.log('mime type', mime.lookup(attachment.filename));
    console.log('evaluo type', this);

    // convert message type
    if (payload.discordMessage.type === 'DEFAULT') {
      if (this.hasImages(payload.discordMessage)) {
        type = 'photo';
      } else {
        type = 'message';
      }
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

      // skip if it's from the bot
      if (message.author.bot) {
        return;
      }

      chatServer.receive({ discordMessage: message });
    });
    return options.connector.login(options.token);
  }
});

Discord.mixin({

  hasImages: function(message) {
    var attachment = message.attachments.find(function(attachment) {
      return filenameIsImage(attachment.filename);
    });
    return attachment != null;
  }

});

Discord.in('photo', function(message) {
  var discordMessage = message.originalMessage.discordMessage;
  var imageAttachment = discordMessage.attachments.find(function(attachment) {
    return filenameIsImage(attachment.filename);
  });

  return request({ method: 'GET', uri: imageAttachment.url })
    .then(function(response) {
      message.payload.content = response;
      return message;
    });
});


Discord.in('message', function(message) {
  var chatContext = message.chat();
  var discordMessage = message.originalMessage.discordMessage;

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
  //console.log('--->>>>>>>>', message.originalMessage);
  var discordMessage = message.originalMessage.discordMessage;
  return discordMessage.reply(message.payload.content);
});


Discord.registerMessageType('message', 'Message', 'Send a plain text message');
Discord.registerMessageType('photo', 'Photo', 'Send a photo message');

module.exports = Discord;





