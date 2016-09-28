var _ = require('underscore');
var moment = require('moment');
var ChatContext = require('./lib/chat-context.js');
var ChatLog = require('./lib/chat-log.js');
var helpers = require('./lib/helpers/facebook.js');
var fs = require('fs');
var os = require('os');
var request = require('request').defaults({ encoding: null });
var https = require('https');
var http = require('http');
var Bot = require('./lib/messenger-bot');
var clc = require('cli-color');

var DEBUG = true;
var green = clc.greenBright;
var white = clc.white;
var red = clc.red;
var grey = clc.blackBright;

module.exports = function(RED) {

  function FacebookBotNode(n) {
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

      /*
       { sender: { id: '10153461620831415' },
       recipient: { id: '141972351547' },
       timestamp: 1468868282071,
       message:
       { mid: 'mid.1468868282014:a9429329545544f523',
       seq: 334,
       text: 'test' },
       transport: 'facebook' }

       */

      var facebookBot = self.bot;

      if (DEBUG) {
        console.log('START:-------');
        console.log(botMsg);
        console.log('END:-------');
      }

      // mark the original message with the platform
      botMsg = _.extend({}, botMsg, {transport: 'facebook'});

      var userId = botMsg.sender.id;
      var chatId = botMsg.sender.id;
      var messageId = botMsg.message.mid;
      var context = self.context();
      // todo fix this
      //var isAuthorized = node.config.isAuthorized(username, userId);
      var isAuthorized = true;

      // get or create chat id
      var chatContext = context.global.get('chat:' + chatId);
      if (chatContext == null) {
        chatContext = ChatContext(chatId);
        context.global.set('chat:' + chatId, chatContext);
      }

      var payload = null;
      // decode the message, eventually download stuff
      self.getMessageDetails(botMsg, self.bot)
        .then(function (obj) {
          payload = obj;
          return helpers.getOrFetchProfile(userId, self.bot)
        })
        .then(function(profile) {
          // store some information
          chatContext.set('chatId', chatId);
          chatContext.set('messageId', botMsg.message.mid);
          chatContext.set('userId', userId);
          chatContext.set('firstName', profile.first_name);
          chatContext.set('lastName', profile.last_name);
          chatContext.set('authorized', isAuthorized);
          chatContext.set('transport', 'facebook');
          chatContext.set('message', botMsg.message.text);

          var chatLog = new ChatLog(chatContext);
          return chatLog.log({
            payload: payload,
            originalMessage: {
              transport: 'facebook',
              chat: {
                id: chatId
              }
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
      this.token = this.credentials.token;
      this.app_secret = this.credentials.app_secret;
      this.verify_token = this.credentials.verify_token;

      if (this.token) {
        this.token = this.token.trim();

        if (!this.bot) {

          this.bot = new Bot({
            token: this.token,
            verify: this.verify_token,
            app_secret: this.app_secret
          });

          var uiPort = RED.settings.get('uiPort');
          console.log('');
          console.log(grey('------ Facebook Webhook ----------------'));
          console.log(green('Webhook URL: ') + white('http://localhost' + (uiPort != '80' ? ':' + uiPort : '')
              + '/redbot/facebook'));
          console.log(green('Verify token is: ') + white(this.verify_token));
          console.log('');
          // mount endpoints on local express
          this.bot.expressMiddleware(RED.httpNode);

          this.bot.on('message', this.handleMessage);
        }
      }
    }

    this.on('close', function (done) {

      var endpoints = ['/facebook', '/facebook/_status'];

      // remove middleware for facebook callback
      RED.httpNode._router.stack.forEach(function(route, i, routes) {
        if (route.route && _.contains(endpoints, route.route.path)) {
          routes.splice(i, 1);
        }
      });
      done();
    });

    this.isAuthorized = function (username, userId) {
      if (self.usernames.length > 0) {
        return self.usernames.indexOf(username) != -1 || self.usernames.indexOf(String(userId)) != -1;
      }
      return true;
    };

    // creates the message details object from the original message
    this.getMessageDetails = function (botMsg, bot) {
      return new Promise(function (resolve, reject) {

        var userId = botMsg.sender.id;
        var chatId = botMsg.sender.id;
        var messageId = botMsg.message.mid;

        if (botMsg.message == null) {
          reject('Unable to detect inbound message for Facebook');
        }

        var message = botMsg.message;
        if (!_.isEmpty(message.text)) {
          resolve({
            chatId: chatId,
            messageId: messageId,
            type: 'message',
            content: message.text,
            date: moment(botMsg.timestamp),
            inbound: true
          });
          return;
        }

        if (_.isArray(message.attachments) && !_.isEmpty(message.attachments)) {

          var attachment = message.attachments[0];

          switch(attachment.type) {
            case 'image':
              // download the image into a buffer
              helpers.downloadFile(attachment.payload.url)
                .then(function(buffer) {
                  resolve({
                    chatId: chatId,
                    messageId: messageId,
                    type: 'photo',
                    content: buffer,
                    date: moment(botMsg.timestamp),
                    inbound: true
                  });
                })
                .catch(function() {
                  reject('Unable to download ' + attachment.payload.url);
                });


              break;
            case 'location':

              resolve({
                chatId: chatId,
                messageId: messageId,
                type: 'location',
                content: {
                  latitude: attachment.payload.cooordinates.lat,
                  longitude: attachment.payload.cooordinates.long
                },
                date: moment(botMsg.timestamp),
                inbound: true
              });

              break;
          }

        } else {
          reject('Unable to detect inbound message for Facebook Messenger');
        }


        /*

         { type: 'image',
         payload: { url: 'https://scontent.xx.fbcdn.net/v/t34.0-12/13714319_10153570333851415_183484103_n.png?_nc_ad=z-m&oh=1fd1db8c6faec91c340b22f75a2eb025&oe=578EF45F' } }
         */


      });
    }

  }

  RED.nodes.registerType('chatbot-facebook-node', FacebookBotNode, {
    credentials: {
      token: {
        type: 'text'
      },
      app_secret: {
        type: 'text'
      },
      verify_token: {
        type: 'text'
      },
      key_pem: {
        type: 'text'
      },
      cert_pem: {
        type: 'text'
      }
    }
  });

  function FacebookInNode(config) {
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
  RED.nodes.registerType('chatbot-facebook-receive', FacebookInNode);


  function FacebookOutNode(config) {
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
            request({
              method: 'POST',
              json: {
                recipient: {
                  id: msg.payload.chatId
                },
                'sender_action': 'typing_on'
              },
              url: 'https://graph.facebook.com/v2.6/me/messages?access_token=' + credentials.token
            }, reportError);
            break;

          case 'buttons':
            // prepare buttons
            var quickReplies = _(msg.payload.buttons).map(function(button) {
              return {
                content_type: 'text',
                title: button,
                payload: button
              };
            });
            // send
            bot.sendMessage(
              msg.payload.chatId,
              {
                text: msg.payload.content,
                quick_replies: quickReplies
              },
              reportError
            );
            break;

          case 'message':
            bot.sendMessage(
              msg.payload.chatId,
              {
                text: msg.payload.content
              },
              reportError
            );
            break;

          case 'location':
            var lat = msg.payload.content.latitude;
            var lon = msg.payload.content.longitude;

            var attachment = {
              'type': 'template',
              'payload': {
                'template_type': 'generic',
                'elements': {
                  'element': {
                    'title': !_.isEmpty(msg.payload.place) ? msg.payload.place : 'Position',
                    'image_url': 'https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&center='
                      + lat + ',' + lon + '&zoom=16&markers=' + lat + ',' + lon,
                    'item_url': 'http:\/\/maps.apple.com\/maps?q=' + lat + ',' + lon + '&z=16'
                  }
                }
              }
            };

            bot.sendMessage(
              msg.payload.chatId,
              {
                attachment: attachment
              },
              reportError
            );
            break;

          case 'audio':
            var audio = msg.payload.content;
            helpers.uploadBuffer({
              recipient: msg.payload.chatId,
              type: 'audio',
              buffer: audio,
              token: credentials.token,
              filename: msg.payload.filename
            }).catch(function(err) {
              reject(err);
            });
            break;

          case 'photo':
            var image = msg.payload.content;
            helpers.uploadBuffer({
              recipient: msg.payload.chatId,
              type: 'image',
              buffer: image,
              token: credentials.token,
              filename: msg.payload.filename
            }).catch(function(err) {
              reject(err);
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
      if (msg.originalMessage != null && msg.originalMessage.transport !== 'facebook') {
        // exit, it's not from facebook
        return;
      }

      if (msg.payload == null) {
        node.warn("msg.payload is empty");
        return;
      }
      if (msg.payload.chatId == null) {
        node.warn("msg.payload.channelId is empty");
        return;
      }
      if (msg.payload.type == null) {
        node.warn("msg.payload.type is empty");
        return;
      }

      var channelId = msg.payload.chatId;
      var context = node.context();
      var track = node.track;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var chatContext = context.global.get('chat:' + chatId);

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (chatContext != null && track && !_.isEmpty(node.wires[0])) {
        chatContext.set('currentConversationNode', node.id);
        chatContext.set('currentConversationNode_at', moment());
      }

      var chatLog = new ChatLog(chatContext);

      chatLog.log(msg, this.config.log)
        .then(function () {
          sendMessage(msg);
        });

    });
  }
  RED.nodes.registerType('chatbot-facebook-send', FacebookOutNode);

};
