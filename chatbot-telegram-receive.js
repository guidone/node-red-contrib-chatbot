var _ = require('underscore');
var telegramBot = require('node-telegram-bot-api');

module.exports = function(RED) {

  // --------------------------------------------------------------------------------------------
  // The configuration node
  // holds the token
  // and establishes the connection to the telegram bot
  function TelegramBotNode(n) {
    RED.nodes.createNode(this, n);

    var self = this;
    this.botname = n.botname;

    this.usernames = [];
    if (n.usernames) {
      this.usernames = n.usernames.split(',');
    }

    this.chatids = [];
    if (n.chatids) {
      this.chatids = n.chatids.split(',').map(function (item) {
        return parseInt(item, 10);
      });
    }

    if (this.credentials) {
      this.token = this.credentials.token;
      if (this.token) {
        this.token = this.token.trim();
        if (!this.telegramBot) {
          this.telegramBot = new telegramBot(this.token, { polling: true });
          this.telegramBot.setMaxListeners(0);
        }
      }
    }


    this.on('close', function (done) {

      // Workaround as the underlying bot api does not offer a stop function.
      if (self.telegramBot._polling) {
        self.telegramBot._polling.abort = true;
        self.telegramBot._polling.lastRequest.cancel('Closing node.');
        self.telegramBot._polling = undefined;
      }

      done();
    });

    this.isAuthorizedUser = function (user) {
      var isAuthorized = false;
      if (self.usernames.length > 0) {
        if (self.usernames.indexOf(user) >= 0) {
          isAuthorized = true;
        }
      }

      return isAuthorized;
    }

    this.isAuthorizedChat = function (chatid) {
      var isAuthorized = false;
      var length = self.chatids.length;
      if (length > 0) {
        for (var i = 0; i < length; i++) {
          var id = self.chatids[i];
          if (id == chatid) {
            isAuthorized = true;
            break;
          }
        }
      }

      return isAuthorized;
    }

    this.isAuthorized = function (chatid, user) {
      var isAuthorizedUser = self.isAuthorizedUser(user);
      var isAuthorizedChatId = self.isAuthorizedChat(chatid);

      var isAuthorized = false;

      if (isAuthorizedUser || isAuthorizedChatId) {
        isAuthorized = true;
      } else {
        if (self.chatids.length == 0 && self.usernames.length == 0) {
          isAuthorized = true;
        }
      }

      return isAuthorized;
    }
  }
  RED.nodes.registerType("chatbot-telegram-node", TelegramBotNode, {
    credentials: {
      token: { type: "text" }
    }
  });


  // creates the message details object from the original message
  function getMessageDetails(botMsg) {

    var messageDetails;
    if (botMsg.text) {
      messageDetails = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'message',
        content: botMsg.text
      };
    } else if (botMsg.photo) {
      messageDetails = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'photo',
        content: botMsg.photo[0].file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.audio) {
      messageDetails = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'audio',
        content: botMsg.audio.file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.document) {
      messageDetails = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'document',
        content: botMsg.document.file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.sticker) {
      messageDetails = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'sticker',
        content: botMsg.sticker.file_id
      };
    } else if (botMsg.video) {
      messageDetails = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'video',
        content: botMsg.video.file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.voice) {
      messageDetails = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'voice',
        content: botMsg.voice.file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.location) {
      messageDetails = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'location',
        content: botMsg.location
      };
    } else if (botMsg.contact) {
      messageDetails = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'contact',
        content: botMsg.contact
      };
    }

    // mark the message as inbound
    messageDetails.inbound = true;

    return messageDetails;
  }


  function TelegramInNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({ fill: "red", shape: "ring", text: "disconnected" });

      node.telegramBot = this.config.telegramBot;
      if (node.telegramBot) {
        this.status({ fill: "green", shape: "ring", text: "connected" });

        node.telegramBot.on('message', function(botMsg) {
          var username = botMsg.from.username;
          var chatid = botMsg.chat.id;
          var context = node.context();
          var currentConversationNode = context.flow.get('currentConversationNode');
          // store some data in context
          context.flow.set('chatId', chatid);
          context.flow.set('messageId', botMsg.message_id);
          context.flow.set('firstName', botMsg.from.first_name);
          context.flow.set('lastName', botMsg.from.last_name);
          // decode the message
          var messageDetails = getMessageDetails(botMsg);
          if (messageDetails) {
            var msg = {
              payload: messageDetails,
              originalMessage: botMsg
            };

            // if a conversation is going on, go straight to the conversation node, otherwise if authorized
            // then first pin, if not second pin
            if (currentConversationNode != null) {
              // void the current conversation
              context.flow.set('currentConversationNode', null);
              // emit message
              RED.events.emit('node:' + currentConversationNode, msg);
            } else if (node.config.isAuthorized(chatid, username)) {
              node.send([msg, null]);
            } else {
              node.send([null, msg]);
            }
          }
        });
      } else {
        node.warn("no bot in config.");
      }
    } else {
      node.warn("no config.");
    }
  }
  RED.nodes.registerType('chatbot-telegram-receive', TelegramInNode);



  function TelegramOutNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({ fill: "red", shape: "ring", text: "disconnected" });

      node.telegramBot = this.config.telegramBot;
      if (node.telegramBot) {
        this.status({ fill: "green", shape: "ring", text: "connected" });
      } else {
        node.warn("no bot in config.");
      }
    } else {
      node.warn("no config.");
    }

    this.on('input', function (msg) {

      if (msg.payload == null) {
        node.warn("msg.payload is empty");
        return;
      }
      if (msg.payload.content == null) {
        node.warn("msg.payload.content is empty");
        return;
      }
      if (msg.payload.chatId == null) {
        node.warn("msg.payload.chatId is empty");
        return;
      }
      if (msg.payload.type == null) {
        node.warn("msg.payload.type is empty");
        return;
      }

      var chatId = msg.payload.chatId;
      var type = msg.payload.type;

      switch (type) {
        case 'message':

          // the maximum message size is 4096 so we must split the message into smaller chunks.
          var chunkSize = 4000;
          var message = msg.payload.content;

          var done = false;
          do {
            var messageToSend;
            if (message.length > chunkSize) {
              messageToSend = message.substr(0, chunkSize);
              message = message.substr(chunkSize);
            } else {
              messageToSend = message;
              done = true;
            }

            node.telegramBot.sendMessage(chatId, messageToSend, msg.payload.options).then(function (sent) {
              msg.payload.sentMessageId = sent.message_id;
              node.send(msg);
            });

          } while (!done)


          break;
        case 'photo':
          node.telegramBot.sendPhoto(chatId, msg.payload.content, msg.payload.options).then(function (sent) {
            msg.payload.sentMessageId = sent.message_id;
            node.send(msg);
          });
          break;
        case 'audio':
          node.telegramBot.sendAudio(chatId, msg.payload.content, msg.payload.options).then(function (sent) {
            msg.payload.sentMessageId = sent.message_id;
            node.send(msg);
          });
          break;
        case 'document':
          node.telegramBot.sendDocument(chatId, msg.payload.content, msg.payload.options).then(function (sent) {
            msg.payload.sentMessageId = sent.message_id;
            node.send(msg);
          });
          break;
        case 'sticker':
          node.telegramBot.sendSticker(chatId, msg.payload.content, msg.payload.options).then(function (sent) {
            msg.payload.sentMessageId = sent.message_id;
            node.send(msg);
          });
          break;
        case 'video':
          node.telegramBot.sendVideo(chatId, msg.payload.content, msg.payload.options).then(function (sent) {
            msg.payload.sentMessageId = sent.message_id;
            node.send(msg);
          });
          break;
        case 'voice':
          node.telegramBot.sendVoice(chatId, msg.payload.content, msg.payload.options).then(function (sent) {
            msg.payload.sentMessageId = sent.message_id;
            node.send(msg);
          });
          break;
        case 'location':
          node.telegramBot.sendLocation(chatId, msg.payload.content.latitude, msg.payload.content.longitude, msg.payload.options).then(function (sent) {
            msg.payload.sentMessageId = sent.message_id;
            node.send(msg);
          });
          break;
        default:
          // unknown type, do nothing
      }


    });
  }
  RED.nodes.registerType('chatbot-telegram-send', TelegramOutNode);


};
