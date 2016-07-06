var _ = require('underscore');
var telegramBot = require('node-telegram-bot-api');
var moment = require('moment');
var ChatContext = require('./lib/chat-context.js');


module.exports = function(RED) {

  function TelegramBotNode(n) {
    RED.nodes.createNode(this, n);

    var self = this;
    this.botname = n.botname;

    this.usernames = [];
    if (n.usernames) {

      this.usernames = _(n.usernames.split(',')).chain()
        .map(function(userId) {
          return userId.match(/^[0-9]*?$/) ? parseInt(userId, 10) : null
        })
        .compact()
        .value();
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

      if (self.telegramBot._polling) {
        self.telegramBot._polling.abort = true;
        self.telegramBot._polling.lastRequest.cancel('Closing node.');
        self.telegramBot._polling = undefined;
      }

      done();
    });

    this.isAuthorizedUser = function (user) {
      // always authorized if no usernames
      if (self.usernames.length > 0) {
        return self.usernames.indexOf(user) >= 0;
      }
      return true;
    };

    this.isAuthorized = function (chatId, user) {
      return self.isAuthorizedUser(user);
    }
  }
  RED.nodes.registerType('chatbot-telegram-node', TelegramBotNode, {
    credentials: {
      token: {
        type: 'text'
      }
    }
  });


  // creates the message details object from the original message
  function getMessageDetails(botMsg) {

    var payload;
    if (botMsg.text) {
      payload = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'message',
        content: botMsg.text
      };
    } else if (botMsg.photo) {
      payload = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'photo',
        content: botMsg.photo[0].file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.audio) {
      payload = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'audio',
        content: botMsg.audio.file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.document) {
      payload = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'document',
        content: botMsg.document.file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.sticker) {
      payload = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'sticker',
        content: botMsg.sticker.file_id
      };
    } else if (botMsg.video) {
      payload = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'video',
        content: botMsg.video.file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.voice) {
      payload = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'voice',
        content: botMsg.voice.file_id,
        caption: botMsg.caption,
        date: botMsg.date
      };
    } else if (botMsg.location) {
      payload = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'location',
        content: botMsg.location
      };
    } else if (botMsg.contact) {
      payload = {
        chatId: botMsg.chat.id,
        messageId: botMsg.message_id,
        type: 'contact',
        content: botMsg.contact
      };
    }

    // mark the message as inbound
    payload.inbound = true;

    return payload;
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
          var username = botMsg.from.first_name + ' ' + botMsg.from.last_name;
          var chatId = botMsg.chat.id;
          var userId = botMsg.from.id;
          var context = node.context();
          var isAuthorized = node.config.isAuthorized(chatId, userId);

          // create list of users if not present
          var chatBotUsers = context.flow.get('chatBotUsers');
          if (chatBotUsers == null) {
            chatBotUsers = {};
            context.flow.set('chatBotUsers', chatBotUsers);
          }

          // store the user
          chatBotUsers[chatId] = {
            chatId: chatId,
            username: username,
            timestamp: moment()
          };

          // get or create chat id
          var chatContext = context.flow.get('chat:' + chatId);
          if (chatContext == null) {
            chatContext = ChatContext(chatId);
            context.flow.set('chat:' + chatId, chatContext);
          }

          // store some information
          chatContext.set('chatId', chatId);
          chatContext.set('messageId', botMsg.message_id);
          chatContext.set('userId', userId);
          chatContext.set('firstName', botMsg.from.first_name);
          chatContext.set('lastName', botMsg.from.last_name);
          chatContext.set('authorized', isAuthorized);

          // decode the message
          var payload = getMessageDetails(botMsg);
          if (payload) {
            var msg = {
              payload: payload,
              originalMessage: botMsg
            };

            var currentConversationNode = chatContext.get('currentConversationNode');
            // if a conversation is going on, go straight to the conversation node, otherwise if authorized
            // then first pin, if not second pin
            if (currentConversationNode != null) {
              // void the current conversation
              chatContext.set('currentConversationNode', null);
              // emit message directly the node where the conversation stopped
              RED.events.emit('node:' + currentConversationNode, msg);
            } else {
              node.send(msg);
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

      /*if (msg.payload.content == null) {
        node.warn("msg.payload.content is empty");
        return;
      }*/


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

          } while (!done);


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
        case 'action':
          node.telegramBot.sendChatAction(chatId, msg.payload.waitingType != null ? msg.payload.waitingType : 'typing')
            .then(function (sent) {
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
