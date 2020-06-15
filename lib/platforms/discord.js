var moment = require('moment');
var { ChatExpress } = require('chat-platform');
var DiscordJS = require('discord.js');
// var ChatLog = require('../chat-log');
// var request = require('request').defaults({ encoding: null });
var utils = require('../../lib/helpers/utils');

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
  onCreateMessage: function(obj) {
    var options = this.getOptions();
    var client = options.connector;

    // fake a discord message
    obj.originalMessage.discordMessage = {
      channel: new DiscordJS.DMChannel(client, {
        id: obj.originalMessage.chatId,
        recipients: [new DiscordJS.User(client, { id: obj.originalMessage.chatId })]
      })
    };

    return obj;
  },
  type: function(payload) {
    var type = null;

    //console.log('payload', payload.discordMessage);

    // convert message type
    if (payload.discordMessage.type === 'DEFAULT') {
      if (this.hasImage(payload.discordMessage)) {
        type = 'photo';
      } else {
        type = 'message';
      }
    }
    return type;
  },
  onStop: function() {
    var options = this.getOptions();
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
      // pipe the incoming payload
      chatServer.receive({ discordMessage: message });
    });
    return options.connector.login(options.token);
  }
});

Discord.mixin({

  hasImage: function(message) {
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
      message.payload.caption = discordMessage.content;
      message.payload.filename = imageAttachment.filename;
      return message;
    });
});

Discord.out('photo', function(message) {
  var discordMessage = message.originalMessage.discordMessage;
  var attachment = new DiscordJS.Attachment(message.payload.content);
  return discordMessage.channel.send(attachment);
});

Discord.in('message', function(message) {
  var discordMessage = message.originalMessage.discordMessage;

  return new Promise(function(resolve) {
    message.payload.content = discordMessage.content;
    resolve(message);
  });
});

Discord.out('message', function(message) {
  var discordMessage = message.originalMessage.discordMessage;
  return discordMessage.channel.send(message.payload.content);
});

Discord.registerMessageType('message', 'Message', 'Send a plain text message');
Discord.registerMessageType('photo', 'Photo', 'Send a photo message');

module.exports = Discord;
