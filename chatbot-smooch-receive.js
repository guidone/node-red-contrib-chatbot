var _ = require('underscore');
var moment = require('moment');
var fs = require('fs');
var os = require('os');
var request = require('request').defaults({ encoding: null });
var SmoochBot = require('./lib/smooch/smooch-bot');
var ChatContext = require('./lib/chat-context');
var ChatContextStore = require('./lib/chat-context-store');
var ChatLog = require('./lib/chat-log');
var helpers = require('./lib/smooch/helpers');
var clc = require('cli-color');

var DEBUG = false;
var green = clc.greenBright;
var white = clc.white;
var red = clc.red;
var grey = clc.blackBright;

module.exports = function(RED) {

  function SmoochBotNode(n) {
    RED.nodes.createNode(this, n);

    var self = this;
    this.botname = n.botname;
    this.log = n.log;

    this.usernames = [];
    if (n.usernames) {

      this.usernames = _(n.usernames.split(',')).chain()
        .map(function(userId) {
          return userId.match(/^[a-zA-Z0-9_]+?$/) ? userId : null
        })
        .compact()
        .value();
    }


    this.handleMessage = function(botMsg) {


      var facebookBot = self.bot;

      if (DEBUG) {
        console.log('START:-------');
        console.log(botMsg);
        console.log('END:-------');
      }

      // mark the original message with the platform
      botMsg.transport = 'smooch';

      var userId = botMsg.authorId;
      var chatId = botMsg.authorId;
      var messageId = botMsg._id;
      var context = self.context();
      // todo fix this
      //var isAuthorized = node.config.isAuthorized(username, userId);
      var isAuthorized = true;
      var chatContext = ChatContextStore.getOrCreateChatContext(self, chatId);

      // decode the message, eventually download stuff
      self.getMessageDetails(botMsg, self.bot)
        .then(function(payload) {
          // store some information
          chatContext.set('chatId', chatId);
          chatContext.set('messageId', messageId);
          chatContext.set('userId', userId);
          chatContext.set('firstName', botMsg.name);
          chatContext.set('lastName', null);
          chatContext.set('authorized', isAuthorized);
          chatContext.set('transport', 'smooch');
          chatContext.set('message', botMsg.text);

          var chatLog = new ChatLog(chatContext);

          return chatLog.log({
            payload: payload,
            originalMessage: {
              transport: 'smooch',
              chat: {
                id: chatId
              }
            },
            chat: function() {
              return ChatContextStore.getChatContext(self, chatId);
            }
          }, self.log)
        })
        .then(function (msg) {

          var currentConversationNode = chatContext.get('currentConversationNode');
          // if a conversation is going on, go straight to the conversation node, otherwise if authorized
          // then first pin, if not second pin
          if (currentConversationNode != null) {
            // void the current conversation
            chatContext.set('currentConversationNode', null);
            // emit message directly the node where the conversation stopped
            RED.events.emit('node:' + currentConversationNode, msg);
          } else {
            facebookBot.emit('relay', msg);
          }

        })
        .catch(function (error) {
          facebookBot.emit('relay', null, error);
        });
    };


    if (this.credentials) {
      this.keyId = this.credentials.keyId;
      this.secret = this.credentials.secret;
      if (this.keyId != null && this.secret != null) {
        this.keyId = this.keyId.trim();
        this.secret = this.secret.trim();

        if (!this.bot) {
          this.bot = new SmoochBot({
            keyId: this.keyId,
            secret: this.secret
          });

          var uiPort = RED.settings.get('uiPort');
          console.log('');
          console.log(grey('------ Smooch Webhook ----------------'));
          console.log(green('Webhook URL: ') + white('http://localhost' + (uiPort != '80' ? ':' + uiPort : '')
              + '/redbot/smooch'));
          console.log('');
          // mount endpoints on local express
          this.bot.addExpressMiddleware(RED.httpNode);

          this.bot.on('message', this.handleMessage);
        }
      }
    }

    this.on('close', function (done) {
      self.bot.removeExpressMiddleware(RED.httpNode);
      done();
    });

    this.isAuthorized = function (username, userId) {
      if (self.usernames.length > 0) {
        return self.usernames.indexOf(username) != -1 || self.usernames.indexOf(String(userId)) != -1;
      }
      return true;
    };

    // creates the message details object from the original message
    this.getMessageDetails = function (message, bot) {

      return new Promise(function (resolve, reject) {

        var chatId = message.authorId;
        var messageId = message._id;

        if (message.mediaUrl != null && message.mediaType.indexOf('image') !== -1) {

          helpers.downloadFile(message.mediaUrl)
            .then(function(buffer) {
              resolve({
                chatId: chatId,
                messageId: messageId,
                type: 'photo',
                content: buffer,
                date: moment(message.received),
                inbound: true
              });
            })
            .catch(function() {
              reject('Unable to download ' + message.mediaUrl);
            });
        } else if (!_.isEmpty(message.text)) {
          resolve({
            chatId: chatId,
            messageId: messageId,
            type: 'message',
            content: message.text,
            date: moment(message.received),
            inbound: true
          });
        }


      });
    }

  }

  RED.nodes.registerType('chatbot-smooch-node', SmoochBotNode, {
    credentials: {
      keyId: {
        type: 'text'
      },
      secret: {
        type: 'text'
      }
    }
  });

  function SmoochInNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});

      node.bot = this.config.bot;

      if (node.bot) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});

        node.bot.on('relay', function(message, error) {
          if (error != null) {
            node.error(error);
          } else {
            node.send(message);
          }
        });

      } else {
        node.warn("no bot in config.");
      }
    } else {
      node.warn('Missing configuration in Facebook Messenger Receiver');
    }
  }
  RED.nodes.registerType('chatbot-smooch-receive', SmoochInNode);


  function SmoochOutNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;
    this.track = config.track;

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});

      node.bot = this.config.bot;

      if (node.bot) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
      } else {
        node.warn("no bot in config.");
      }
    } else {
      node.warn("no config.");
    }

    function sendMessage(msg) {

      return new Promise(function(resolve, reject) {

        var type = msg.payload.type;
        var bot = node.bot;
        var credentials = node.config.credentials;

        var reportError = function(err) {
          if (err) {
            reject(err);
          } else {
            resolve()
          }
        };

        switch (type) {
          case 'action':
            // implement actions
            break;

          case 'message':
            bot.sendMessage(msg.payload.chatId, msg.payload.content, reportError);
            break;

          case 'buttons':
            return bot.sendActions(msg.payload.chatId, msg.payload.content, msg.payload.buttons);
            break;

          case 'photo':
            var image = msg.payload.content;
            bot.uploadBuffer(msg.payload.chatId, image)
              .catch(function(err) {
                reject(err);
              })
              .then(function() {
                resolve();
              });
            break;

          default:
            reject('Unable to prepare unknown message type');
        }

      });
    }

    // relay message
    var handler = function(msg) {
      node.send(msg);
    };
    RED.events.on('node:' + config.id, handler);

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });

    this.on('input', function (msg) {

      // check if the message is from facebook
      if (msg.originalMessage != null && msg.originalMessage.transport !== 'smooch') {
        // exit, it's not from smooch
        return;
      }

      var track = node.track;
      var chatContext = msg.chat();

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (chatContext != null && track && !_.isEmpty(node.wires[0])) {
        chatContext.set('currentConversationNode', node.id);
        chatContext.set('currentConversationNode_at', moment());
      }

      var chatLog = new ChatLog(chatContext);

      chatLog.log(msg, this.config.log)
        .then(function () {
          return sendMessage(msg);
        })
        .catch(function(err) {
          node.error(err);
        });

    });
  }
  RED.nodes.registerType('chatbot-smooch-send', SmoochOutNode);

};
