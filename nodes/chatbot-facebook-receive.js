var _ = require('underscore');
var moment = require('moment');
var ChatLog = require('../lib/chat-log');
var ChatContextStore = require('../lib/chat-context-store');
var helpers = require('../lib/facebook/facebook');
var utils = require('../lib/helpers/utils');
var request = require('request').defaults({ encoding: null });
var Bot = require('../lib/facebook/messenger-bot');
var clc = require('cli-color');

var DEBUG = false;
var green = clc.greenBright;
var white = clc.white;
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

      var facebookBot = this;

      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log('START:-------');
        // eslint-disable-next-line no-console
        console.log(botMsg);
        // eslint-disable-next-line no-console
        console.log('END:-------');
      }

      // mark the original message with the platform
      botMsg = _.extend({}, botMsg, {transport: 'facebook'});

      var userId = botMsg.sender.id;
      var chatId = botMsg.sender.id;
      var messageId = botMsg.message != null ? botMsg.message.mid : null;
      // todo fix this
      //var isAuthorized = node.config.isAuthorized(username, userId);
      var isAuthorized = true;
      var chatContext = ChatContextStore.getOrCreateChatContext(self, chatId);

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
          chatContext.set('messageId', messageId);
          chatContext.set('userId', userId);
          chatContext.set('firstName', profile.first_name);
          chatContext.set('lastName', profile.last_name);
          chatContext.set('authorized', isAuthorized);
          chatContext.set('transport', 'facebook');
          chatContext.set('message', payload.content);

          var chatLog = new ChatLog(chatContext);
          return chatLog.log({
            payload: payload,
            originalMessage: {
              transport: 'facebook',
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
          // eslint-disable-next-line no-console
          console.log('');
          // eslint-disable-next-line no-console
          console.log(grey('------ Facebook Webhook ----------------'));
          // eslint-disable-next-line no-console
          console.log(green('Webhook URL: ') + white('http://localhost' + (uiPort != '80' ? ':' + uiPort : '')
              + '/redbot/facebook'));
          // eslint-disable-next-line no-console
          console.log(green('Verify token is: ') + white(this.verify_token));
          // eslint-disable-next-line no-console
          console.log('');
          // mount endpoints on local express
          this.bot.expressMiddleware(RED.httpNode);

          this.bot.on('message', this.handleMessage.bind(this.bot));
          this.bot.on('postback', this.handleMessage.bind(this.bot));
          this.bot.on('account_linking', this.handleMessage.bind(this.bot));
        }
      }
    }

    this.on('close', function (done) {
      var endpoints = ['/redbot/facebook', '/redbot/facebook/_status'];
      // remove middleware for facebook callback
      var routesCount = RED.httpNode._router.stack.length;
      _(RED.httpNode._router.stack).each(function (route, i, routes) {
        if (route != null && route.route != null) {
          if (_.contains(endpoints, route.route.path)) {
            routes.splice(i, 1);
          }
        }
      });
      if (RED.httpNode._router.stack.length >= routesCount) {
        // eslint-disable-next-line no-console
        console.log('ERROR: improperly removed Facebook messenger routes, this will cause unexpected results and tricky bugs');
      }
      this.bot = null;
      done();
    });

    this.isAuthorized = function (username, userId) {
      if (self.usernames.length > 0) {
        return self.usernames.indexOf(username) != -1 || self.usernames.indexOf(String(userId)) != -1;
      }
      return true;
    };

    // creates the message details object from the original message
    this.getMessageDetails = function (botMsg) {
      return new Promise(function (resolve, reject) {

        //var userId = botMsg.sender.id;
        var chatId = botMsg.sender.id;
        var messageId = botMsg.message != null ? botMsg.message.mid : null;

        if (!_.isEmpty(botMsg.account_linking)) {
          resolve({
            chatId: chatId,
            messageId: messageId,
            type: 'account-linking',
            content: botMsg.account_linking.authorization_code,
            linkStatus: botMsg.account_linking.status,
            date: moment(botMsg.timestamp),
            inbound:true
          });
          return;
        }

        if (botMsg.message == null) {
          reject('Unable to detect inbound message for Facebook');
        }

        var message = botMsg.message;
        if (!_.isEmpty(message.quick_reply)) {
          resolve({
            chatId: chatId,
            messageId: messageId,
            type: 'message',
            content: message.quick_reply.payload,
            date: moment(botMsg.timestamp),
            inbound: true
          });
          return;
        } else if (!_.isEmpty(message.text)) {
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
            case 'audio':
              // download the audio into a buffer
              helpers.downloadFile(attachment.payload.url)
                .then(function(buffer) {
                  resolve({
                    chatId: chatId,
                    messageId: messageId,
                    type: 'audio',
                    content: buffer,
                    date: moment(botMsg.timestamp),
                    inbound: true
                  });
                })
                .catch(function() {
                  reject('Unable to download ' + attachment.payload.url);
                });
              break;
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
            case 'file':
              // download the image into a buffer
              helpers.downloadFile(attachment.payload.url)
                .then(function(buffer) {
                  resolve({
                    chatId: chatId,
                    messageId: messageId,
                    type: 'document',
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
                  latitude: attachment.payload.coordinates.lat,
                  longitude: attachment.payload.coordinates.long
                },
                date: moment(botMsg.timestamp),
                inbound: true
              });
              break;
          }
        } else {
          reject('Unable to detect inbound message for Facebook Messenger');
        }
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
        node.warn('Please select a chatbot configuration in Facebook Messenger Receiver');
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

    function sendMeta(msg) {
      return new Promise(function(resolve, reject) {

        var type = msg.payload.type;
        var bot = node.bot;

        var reportError = function(err) {
          if (err) {
            reject(err);
          } else {
            resolve()
          }
        };

        switch (type) {
          case 'persistent-menu':
            if (msg.payload.command === 'set') {
              var items = helpers.parseButtons(msg.payload.items);
              // for some reason the called the same button as web_url and not url
              items.forEach(function (item) {
                item.type = item.type === 'url' ? 'web_url' : item.type;
              });
              bot.setPersistentMenu(items, msg.payload.composerInputDisabled, reportError);
            } else if (msg.payload.command === 'delete') {
              bot.removePersistentMenu(reportError);
            }
            break;

          default:
            reject();
        }

      });
    }

    function sendMessage(msg) {

      return new Promise(function(resolve, reject) {

        var type = msg.payload.type;
        var bot = node.bot;
        var credentials = node.config.credentials;
        var elements = null;
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

          case 'request':

            // todo error if not location
            // send
            bot.sendMessage(
              msg.payload.chatId,
              {
                text: msg.payload.content,
                quick_replies: [
                  {
                    'content_type': 'location'
                  }
                ]
              },
              reportError
            );
            break;

          case 'list-template':
            // translate elements into facebook format
            elements = msg.payload.elements.map(function(item) {
              var element = {
                title: item.title,
                buttons: helpers.parseButtons(item.buttons)
              };
              if (!_.isEmpty(item.subtitle)) {
                element.subtitle = item.subtitle;
              }
              if (!_.isEmpty(item.imageUrl)) {
                element.image_url = item.imageUrl;
              }
              return element;
            });
            // sends
            bot.sendMessage(
              msg.payload.chatId,
              {
                attachment: {
                  type: 'template',
                  payload: {
                    template_type: 'list',
                    image_aspect_ratio: msg.payload.aspectRatio,
                    sharable: msg.payload.sharable,
                    elements: elements
                  }
                }
              },
              reportError
            );
            break;

          case 'generic-template':
            // translate elements into facebook format
            elements = msg.payload.elements.map(function(item) {
              var element = {
                title: item.title,
                buttons: helpers.parseButtons(item.buttons)
              };
              if (!_.isEmpty(item.subtitle)) {
                element.subtitle = item.subtitle;
              }
              if (!_.isEmpty(item.imageUrl)) {
                element.image_url = item.imageUrl;
              }
              return element;
            });
            // sends
            bot.sendMessage(
              msg.payload.chatId,
              {
                attachment: {
                  type: 'template',
                  payload: {
                    template_type: 'generic',
                    image_aspect_ratio: msg.payload.aspectRatio,
                    sharable: msg.payload.sharable,
                    elements: elements
                  }
                }
              },
              reportError
            );
            break;

          case 'quick-replies':
            // send
            bot.sendMessage(
              msg.payload.chatId,
              {
                text: msg.payload.content,
                quick_replies: helpers.parseButtons(msg.payload.buttons)
              },
              reportError
            );
            break;

          case 'inline-buttons':
            bot.sendMessage(
              msg.payload.chatId,
              {
                attachment: {
                  type: 'template',
                  payload: {
                    template_type: 'button',
                    text: msg.payload.content,
                    buttons: helpers.parseButtons(msg.payload.buttons)
                  }
                }
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

            var locationAttachment = {
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
                attachment: locationAttachment
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

          case 'document':
            helpers.uploadBuffer({
              recipient: msg.payload.chatId,
              type: 'file',
              buffer: msg.payload.content,
              token: credentials.token,
              filename: msg.payload.filename,
              mimeType: msg.payload.mimeType
            }).catch(function(err) {
              reject(err);
            });
            break;

          case 'video':
            helpers.uploadBuffer({
              recipient: msg.payload.chatId,
              type: 'video',
              buffer: msg.payload.content,
              token: credentials.token,
              filename: msg.payload.filename,
              mimeType: msg.payload.mimeType
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

    this.on('input', function (msg) {
      // check if the message is from facebook
      if (msg.originalMessage != null && msg.originalMessage.transport !== 'facebook') {
        // exit, it's not from facebook
        return;
      }
      // try to send the meta first (those messages that doesn't require a valid payload)
      sendMeta(msg)
        .then(function() {
          // ok, meta sent, stop here
        }, function(error) {
          // if here, either there was an error or no met message was sent
          if (error != null) {
            node.error(error);
          } else {
            // check payload
            var payloadError = utils.hasValidPayload(msg);
            if (payloadError != null) {
              // invalid payload
              node.error(payloadError);
            } else {

              // payload is valid, go on
              var track = node.track;
              var chatContext = msg.chat();
              // check if this node has some wirings in the follow up pin, in that case
              // the next message should be redirected here
              if (chatContext != null && track && !_.isEmpty(node.wires[0])) {
                chatContext.set('currentConversationNode', node.id);
                chatContext.set('currentConversationNode_at', moment());
              }

              var chatLog = new ChatLog(chatContext);

              chatLog.log(msg, node.config.log)
                .then(function () {
                  return sendMessage(msg);
                })
                .then(function() {
                  // we're done
                }, function(err) {
                  node.error(err);
                });
            } // end valid payload
          } // end no error
        }); // end then
    });

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });
  }


  RED.nodes.registerType('chatbot-facebook-send', FacebookOutNode);

};
