var _ = require('underscore');
var SlackBot = require('slackbots');
var moment = require('moment');
var ChatContext = require('./lib/chat-context.js');
var helpers = require('./lib/helpers/slack.js');


module.exports = function(RED) {

  function SlackBotNode(n) {
    RED.nodes.createNode(this, n);

    var self = this;
    this.botname = n.botname;

    this.usernames = [];
    if (n.usernames) {

      this.usernames = _(n.usernames.split(',')).chain()
        .map(function(userId) {
          return userId.match(/^[a-zA-Z0-9_]+?$/) ? userId : null
        })
        .compact()
        .value();
    }

    if (this.credentials) {
      this.token = this.credentials.token;
      if (this.token) {
        this.token = this.token.trim();
        if (!this.slackBot) {
          this.slackBot = new SlackBot({
            token: this.token, // Add a bot https://my.slack.com/services/new/bot and put the token
            name: 'My Bot' // todo get name from config
          });
        }
      }
    }


    this.on('close', function (done) {
      // todo close
      /*if (self.telegramBot._polling) {
        self.telegramBot._polling.abort = true;
        self.telegramBot._polling.lastRequest.cancel('Closing node.');
        self.telegramBot._polling = undefined;
      }
*/
      done();
    });

    this.isAuthorized = function (username, userId) {
      if (self.usernames.length > 0) {
        return self.usernames.indexOf(username) != -1 || self.usernames.indexOf(String(userId)) != -1;
      }
      return true;
    }
  }
  RED.nodes.registerType('chatbot-slack-node', SlackBotNode, {
    credentials: {
      token: {
        type: 'text'
      }
    }
  });

  // creates the message details object from the original message
  function getMessageDetails(message, token) {
    return new Promise(function (resolve, reject) {
      if (message.subtype == 'file_share') {
        // fetch image
        helpers.downloadFile(message.file.url_private_download, token)
          .then(function (buffer) {
            // todo detect which kind of file
            // resolve with an image type
            resolve({
              chatId: message.channel,
              type: 'photo',
              inbound: true,
              content: buffer
            });
          })
          .catch(function (error) {
            reject(error);
          });
      } else if (message.text != null) {
        resolve({
          chatId: message.channel,
          type: 'message',
          inbound: true,
          // todo add date
          content: message.text
        });
      } else {
        reject('Unable to detect inbound message for Slack');
      }
    });
  }

  function SlackInNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});

      node.slackBot = this.config.slackBot;

      if (node.slackBot) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});

        node.slackBot.on('message', function(botMsg) {


          console.log('---- inbound slack', botMsg); // todo remove
          if (botMsg.type !== 'message') {
            return;
          }
          // avoid message from the bot itself
          if (botMsg.subtype === 'bot_message') {
            return;
          }

          //var username = !_.isEmpty(botMsg.from.username) ? botMsg.from.username : null;
          var username = 'guidone'; // todo fix
          var channelId = botMsg.channel;
          var userId = botMsg.user;
          var context = node.context();
          //var isAuthorized = node.config.isAuthorized(username, userId);
          var isAuthorized = true;

          // create list of users if not present
          /*var chatBotUsers = context.flow.get('chatBotUsers');
          if (chatBotUsers == null) {
            chatBotUsers = {};
            context.flow.set('chatBotUsers', chatBotUsers);
          }*/

          // get or create chat id
          var chatContext = context.flow.get('chat:' + channelId);
          if (chatContext == null) {
            chatContext = ChatContext(channelId);
            context.flow.set('chat:' + channelId, chatContext);
          }

          // todo store the user
          /*if (!_.isEmpty(username)) {
            chatBotUsers[chatId] = {
              chatId: chatId,
              username: username,
              timestamp: moment()
            };
            chatContext.set('username', username);
          }*/

          // store some information
          chatContext.set('channelId', channelId);
          //chatContext.set('messageId', botMsg.message_id);
          chatContext.set('userId', userId);
          //chatContext.set('firstName', botMsg.from.first_name);
          //chatContext.set('lastName', botMsg.from.last_name);
          chatContext.set('authorized', isAuthorized);
          chatContext.set('transport', 'slack');


          // decode the message, eventually download stuff
          getMessageDetails(botMsg, node.slackBot.token)
            .then(function(payload) {

              var msg = {
                payload: payload,
                originalMessage: {
                  chat: {
                    id: channelId
                  }
                }
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


            })
            .catch(function(error) {
              node.error(error);
            });
        });
      } else {
        node.warn("no bot in config.");
      }
    } else {
      node.warn("no config.");
    }
  }
  RED.nodes.registerType('chatbot-slack-receive', SlackInNode);


  function SlackOutNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({ fill: "red", shape: "ring", text: "disconnected" });

      node.slackBot = this.config.slackBot;
      if (node.slackBot) {
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
        node.warn("msg.payload.channelId is empty");
        return;
      }
      if (msg.payload.type == null) {
        node.warn("msg.payload.type is empty");
        return;
      }

      var channelId = msg.payload.chatId;
      var type = msg.payload.type;
      var noop = function() {};

      /*if (msg.payload.content == null) {
       node.warn("msg.payload.content is empty");
       return;
       }*/


      switch (type) {
        case 'message':
          node.slackBot.postMessage(channelId, msg.payload.content, {}, noop);
          break;

        case 'photo':
          // todo upload photo first
          break;

        default:
        // unknown type, do nothing
      }


    });
  }
  RED.nodes.registerType('chatbot-slack-send', SlackOutNode);

};
