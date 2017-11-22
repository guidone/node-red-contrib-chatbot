var _ = require('underscore');
var TelegramBot = require('node-telegram-bot-api');
var moment = require('moment');
var ChatLog = require('../lib/chat-log');
var ChatContextStore = require('../lib/chat-context-store');
var helpers = require('../lib/telegram/telegram');
var utils = require('../lib/helpers/utils');
var DEBUG = false;

module.exports = function(RED) {

  function TelegramBotNode(n) {
    RED.nodes.createNode(this, n);

    var self = this;
    this.botname = n.botname;
    this.polling = n.polling;
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

    this.isAuthorized = function (username, userId) {
      if (self.usernames.length > 0) {
        return self.usernames.indexOf(username) != -1 || self.usernames.indexOf(String(userId)) != -1;
      }
      return true;
    };

    // creates the message details object from the original message
    this.getMessageDetails = function getMessageDetails(botMsg) {
      var telegramBot = self.telegramBot;
      return new Promise(function(resolve, reject) {
        if (botMsg.text) {
          resolve({
            chatId: botMsg.chat.id,
            messageId: botMsg.message_id,
            type: 'message',
            content: botMsg.text,
            date: moment.unix(botMsg.date),
            inbound: true
          });
        } else if (botMsg.photo) {
          telegramBot.getFileLink(botMsg.photo[botMsg.photo.length - 1].file_id)
            .then(function(path) {
              return helpers.downloadFile(path);
            })
            .then(function(buffer) {
              resolve({
                chatId: botMsg.chat.id,
                messageId: botMsg.message_id,
                type: 'photo',
                content: buffer,
                caption: botMsg.caption,
                date: moment.unix(botMsg.date),
                inbound: true
              });
            })
            .catch(function(error) {
              reject(error);
            });
        } else if (botMsg.voice) {
          telegramBot.getFileLink(botMsg.voice.file_id)
            .then(function(path) {
              return helpers.downloadFile(path);
            })
            .then(function(buffer) {
               resolve({
                 chatId: botMsg.chat.id,
                 messageId: botMsg.message_id,
                 type: 'audio',
                 content: buffer,
                 caption: botMsg.caption,
                 date: moment.unix(botMsg.date),
                 inbound: true
               });
            });
        } else if (botMsg.document) {
          telegramBot.getFileLink(botMsg.document.file_id)
            .then(function(path) {
              return helpers.downloadFile(path);
            })
            .then(function(buffer) {
              resolve({
                chatId: botMsg.chat.id,
                messageId: botMsg.message_id,
                type: 'document',
                content: buffer,
                caption: botMsg.caption,
                date: moment.unix(botMsg.date),
                inbound: true
              });
            });
        } else if (botMsg.sticker) {
          resolve({
            chatId: botMsg.chat.id,
            messageId: botMsg.message_id,
            type: 'sticker',
            content: botMsg.sticker.file_id,
            date: moment.unix(botMsg.date),
            inbound: true
          });
        } else if (botMsg.video) {
          telegramBot.getFileLink(botMsg.video.file_id)
            .then(function(path) {
              return helpers.downloadFile(path);
            })
            .then(function(buffer) {
              resolve({
                chatId: botMsg.chat.id,
                messageId: botMsg.message_id,
                type: 'video',
                content: buffer,
                caption: botMsg.caption,
                date: moment.unix(botMsg.date),
                inbound: true
              });
            });
        } else if (botMsg.location) {
          resolve({
            chatId: botMsg.chat.id,
            messageId: botMsg.message_id,
            type: 'location',
            content: botMsg.location,
            date: moment.unix(botMsg.date),
            inbound: true
          });
        } else if (botMsg.contact) {
          resolve({
            chatId: botMsg.chat.id,
            messageId: botMsg.message_id,
            type: 'contact',
            content: botMsg.contact,
            date: moment.unix(botMsg.date),
            inbound: true
          });
        } else {
          reject('Unable to detect incoming Telegram message');
        }

      });
    };

    this.handleCallback = function(botMsg) {
      var chatId = botMsg.message.chat.id;
      var alert = false;
      var answer = null;
      if (self.telegramBot.lastInlineButtons[chatId] != null) {
        // find the button with the right value, takes the answer and alert if any
        var button = _(self.telegramBot.lastInlineButtons[chatId]).findWhere({value: botMsg.data});
        if (button != null) {
          answer = button.answer;
          alert = button.alert;
        }
        // do not remove from hash, the user could click again
      }
      // copy the "from" of the message containing user information, not chatbot detail
      botMsg.message.from = botMsg.from;
      // send answer back to client
      self.telegramBot.answerCallbackQuery(botMsg.id, answer, alert)
        .then(function() {
          // send through the message as usual
          botMsg.message.text = botMsg.data;
          self.handleMessage(botMsg.message);
        });
    };

    this.handleMessage = function(botMsg) {

      var telegramBot = self.telegramBot;
      // mark the original message with the platform
      botMsg.transport = 'telegram';

      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log('START:-------');
        // eslint-disable-next-line no-console
        console.log(botMsg);
        // eslint-disable-next-line no-console
        console.log('END:-------');
      }
      var username = !_.isEmpty(botMsg.from.username) ? botMsg.from.username : null;
      var chatId = botMsg.chat.id;
      var userId = botMsg.from.id;
      var isAuthorized = self.isAuthorized(username, userId);
      var chatContext = ChatContextStore.getOrCreateChatContext(self, chatId);

      // store some information
      chatContext.set('chatId', chatId);
      chatContext.set('messageId', botMsg.message_id);
      chatContext.set('userId', userId);
      chatContext.set('firstName', botMsg.from.first_name);
      chatContext.set('lastName', botMsg.from.last_name);
      chatContext.set('authorized', isAuthorized);
      chatContext.set('transport', 'telegram');
      chatContext.set('message', botMsg.text);

      // decode the message
      self.getMessageDetails(botMsg)
        .then(function(payload) {
          var chatLog = new ChatLog(chatContext.all());
          return chatLog.log({
            payload: payload,
            originalMessage: botMsg,
            chat: function() {
              return ChatContextStore.getChatContext(self, chatId);
            }
          }, self.log)
        })
        .then(function(msg) {
          var currentConversationNode = chatContext.get('currentConversationNode');
          // if a conversation is going on, go straight to the conversation node, otherwise if authorized
          // then first pin, if not second pin
          if (currentConversationNode != null) {
            // void node id
            chatContext.set('currentConversationNode', null);
            // emit message directly the node where the conversation stopped
            RED.events.emit('node:' + currentConversationNode, msg);
          } else {
            telegramBot.emit('relay', msg);
          }
        })
        .catch(function(error) {
          telegramBot.emit('relay', null, error);
        });
    }; // end handleMessage

    var telegramBot = null;
    if (this.credentials) {
      this.token = this.credentials.token;
      if (this.token) {
        this.token = this.token.trim();
        if (!this.telegramBot) {
          telegramBot = new TelegramBot(this.token, {
            polling: {
              params: {
                timeout: 10
              },
              interval: !isNaN(parseInt(self.polling, 10)) ? parseInt(self.polling, 10) : 1000
            }
          });
          this.telegramBot = telegramBot;
          this.telegramBot.setMaxListeners(0);
          this.telegramBot.on('message', this.handleMessage);
          this.telegramBot.on('callback_query', this.handleCallback);
        }
      }
    }

    this.on('close', function (done) {
      // stop polling only once
      if (this.telegramBot != null && this.telegramBot._polling) {
        self.telegramBot.off('message', self.handleMessage);
        self.telegramBot.off('callback_query', self.handleCallback);
        self.telegramBot.stopPolling()
          .then(function() {
            self.telegramBot = null;
            done();
          });
      } else {
        done();
      }
    });
  } // end TelegramBotNode

  RED.nodes.registerType('chatbot-telegram-node', TelegramBotNode, {
    credentials: {
      token: {
        type: 'text'
      }
    }
  });

  function TelegramInNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});

      node.telegramBot = this.config.telegramBot;
      if (node.telegramBot) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});

        /*
        todo implement inline
        node.telegramBot.on('inline_query', function(botMsg) {
          console.log('inline request', botMsg);
        });*/

        node.telegramBot.on('relay', function(message, error) {
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
      node.warn("no config.");
    }
  }
  RED.nodes.registerType('chatbot-telegram-receive', TelegramInNode);

  function TelegramOutNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;
    this.track = config.track;
    this.parseMode = config.parseMode;

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({
        fill: 'red',
        shape: 'ring',
        text: 'disconnected'
      });

      node.telegramBot = this.config.telegramBot;
      if (node.telegramBot) {
        this.status({
          fill: 'green',
          shape: 'ring',
          text: 'connected'
        });
      } else {
        node.warn("no bot in config.");
      }
    } else {
      node.warn("no config.");
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

    this.handleError = function(error, msg) {
      // convert to string
      var plainError = error != null ? String(error) : '';
      // remove anything before any eventual '{', telegram lib returns a plain text error
      // in order to parse it
      var jsonError = plainError.replace(/^.*\{/,'{');
      var errorCode = null;
      var errorDescription = plainError;
      // now try to parse
      try {
        var parsedError = JSON.parse(jsonError);
        errorCode = parsedError.error_code;
        errorDescription = parsedError.description;
      } catch(e) {
        // do nothing
      }
      // send out, second parameter goes through the catch all node
      node.error(plainError, {
        chatId: msg.payload.chatId,
        code: errorCode,
        description: errorDescription
      });
    };

    this.on('input', function (msg) {

      // check if the message is from telegram
      if (msg.originalMessage != null && msg.originalMessage.transport !== 'telegram') {
        // exit, it's not from telegram
        return;
      }

      if (msg.payload == null) {
        node.warn('msg.payload is empty');
        return;
      }
      if (msg.payload.chatId == null) {
        node.warn('msg.payload.chatId is empty');
        return;
      }
      if (msg.payload.type == null) {
        node.warn('msg.payload.type is empty');
        return;
      }

      //var context = node.context();
      var buttons = null;
      var track = node.track;
      var parseMode = !_.isEmpty(node.parseMode) ? node.parseMode : null;
      var chatId = utils.getChatId(msg);
      var chatContext = utils.getChatContext(msg);
      var type = msg.payload.type;

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (chatContext != null && track && !_.isEmpty(node.wires[0])) {
        chatContext.set('currentConversationNode', node.id);
        chatContext.set('currentConversationNode_at', moment());
      }

      var messageOk = function (response) {
        chatContext.set('messageId', response.message_id)
      };
      var messageError = function (error) {
        node.handleError(error, msg);
      };

      var chatLog = new ChatLog(chatContext.all());

      chatLog.log(msg, this.config.log)
        .then(function() {

          switch (type) {
            case 'message':
              if (msg.originalMessage.modify_message_id != null) {
                node.telegramBot.editMessageText(msg.payload.content, {
                  chat_id: chatId,
                  message_id: msg.originalMessage.modify_message_id
                }).then(messageOk, messageError);

              } else {
                node.telegramBot.sendMessage(
                  chatId,
                  msg.payload.content,
                  _.extend({}, msg.payload.options, {parse_mode: parseMode})
                ).then(messageOk, messageError);
              }
              break;
            case 'photo':
              node.telegramBot.sendPhoto(chatId, msg.payload.content, {
                caption: msg.payload.caption
              }).then(messageOk, messageError);
              break;
            case 'document':
              node.telegramBot.sendDocument(chatId, msg.payload.content, {
                caption: msg.payload.caption
              }, {
                filename: msg.payload.filename
              }).then(messageOk, messageError);
              break;
            case 'sticker':
              node.telegramBot.sendSticker(chatId, msg.payload.content, msg.payload.options)
                .then(messageOk, messageError);
              break;
            case 'video':
              node.telegramBot.sendVideo(chatId, msg.payload.content, {
                caption: msg.payload.caption
              }).then(messageOk, messageError);
              break;
            case 'audio':
              node.telegramBot.sendVoice(chatId, msg.payload.content, msg.payload.options)
                .then(messageOk, messageError);
              break;
            case 'location':
              node.telegramBot.sendLocation(chatId, msg.payload.content.latitude, msg.payload.content.longitude, msg.payload.options)
                .then(messageOk, messageError);
              break;
            case 'action':
              node.telegramBot.sendChatAction(chatId, msg.payload.waitingType != null ? msg.payload.waitingType : 'typing')
                .then(messageOk, messageError);
              break;
            case 'request':
              var keyboard = null;
              if (msg.payload.requestType === 'location') {
                keyboard = [
                  [{
                    text: !_.isEmpty(msg.payload.buttonLabel) ? msg.payload.buttonLabel : 'Send your position',
                    request_location: true
                  }]
                ];
              } else if (msg.payload.requestType === 'phone-number') {
                keyboard = [
                  [{
                    text: !_.isEmpty(msg.payload.buttonLabel) ? msg.payload.buttonLabel : 'Send your phone number',
                    request_contact: true
                  }]
                ];
              }
              if (keyboard != null) {
                node.telegramBot
                  .sendMessage(chatId, msg.payload.content, {
                    reply_markup: JSON.stringify({
                      keyboard: keyboard,
                      'resize_keyboard': true,
                      'one_time_keyboard': true
                    })
                  })
                  .then(messageOk, messageError);
              } else {
                node.error('Request type not supported');
              }
              break;
            case 'inline-buttons':
              // create inline buttons, docs for this is https://core.telegram.org/bots/api#inlinekeyboardmarkup
              // create the first array of array
              var inlineKeyboard = [[]];
              // cycle through buttons, add new line at the end if flag
              _(msg.payload.buttons).each(function(button) {
                var json = null;
                switch(button.type) {
                  case 'url':
                    json = {
                      text: button.label,
                      url: button.url
                    };
                    break;
                  case 'postback':
                    json = {
                      text: button.label,
                      callback_data: !_.isEmpty(button.value) ? button.value : button.label
                    };
                    break;
                  case 'newline':
                    inlineKeyboard.push([]);
                    break;
                  default:
                    node.error('Telegram is not able to handle this button type "' + button.type + '"');
                }
                if (json != null) {
                  // add the button to the last row, if any
                  inlineKeyboard[inlineKeyboard.length - 1].push(json);
                }
              });
              // store the last buttons, this will be handled by the receiver
              if (node.telegramBot.lastInlineButtons == null) {
                node.telegramBot.lastInlineButtons = {};
              }
              node.telegramBot.lastInlineButtons[chatId] = msg.payload.buttons;
              // send buttons or edit
              if (msg.originalMessage.modify_message_id != null) {
                node.telegramBot.editMessageReplyMarkup(JSON.stringify({
                  inline_keyboard: inlineKeyboard
                }), {
                  chat_id: chatId,
                  message_id: msg.originalMessage.modify_message_id
                }).then(messageOk, messageError);
              } else {
                // finally send
                node.telegramBot.sendMessage(chatId, msg.payload.content, {
                  reply_markup: JSON.stringify({
                    inline_keyboard: inlineKeyboard
                  }),
                  parse_mode: parseMode
                }).then(messageOk, messageError);
              }
              break;
            case 'buttons':
              if (_.isEmpty(msg.payload.content)) {
                node.error('Buttons node needs a non-empty message');
                return;
              }
              buttons = {
                reply_markup: JSON.stringify({
                  keyboard: _(msg.payload.buttons).map(function(button) {
                    return [button.value];
                  }),
                  resize_keyboard: true,
                  one_time_keyboard: true
                }),
                parse_mode: parseMode
              };
              // finally send
              node.telegramBot.sendMessage(
                chatId,
                msg.payload.content,
                buttons
              ).then(messageOk, messageError);
              break;

            default:
            // unknown type, do nothing
          }

        });

    });
  }

  RED.nodes.registerType('chatbot-telegram-send', TelegramOutNode);
};
