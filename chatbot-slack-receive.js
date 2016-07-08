var _ = require('underscore');
var SlackBot = require('slackbots');
var moment = require('moment');
var ChatContext = require('./lib/chat-context.js');


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
          //this.slackBot = new telegramBot(this.token, { polling: true });
          //this.slackBot.setMaxListeners(0);
          this.slackBot = new SlackBot({
            token: 'xoxb-58004866961-sgwOiajRLDIeHspjoCEGH0VE', // Add a bot https://my.slack.com/services/new/bot and put the token
            name: 'My Bot'
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
  function getMessageDetails(botMsg) {

    var payload;

    if (botMsg.text != null) {
      payload = {
        chatId: botMsg.channel,
        //messageId: botMsg.message_id,
        type: 'message',
        content: botMsg.text
      }
    }


    // mark the message as inbound
    payload.inbound = true;

    return payload;
  }

  function SlackInNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({ fill: "red", shape: "ring", text: "disconnected" });

      node.slackBot = this.config.slackBot;
      if (node.slackBot) {
        this.status({ fill: "green", shape: "ring", text: "connected" });

        node.slackBot.on('message', function(botMsg) {


          console.log('---- slack', botMsg);
          if (botMsg.type !== 'message') {
            return;
          }
          // avoid message from the bot itself
          if (botMsg.subtype ==='bot_message') {
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

          // store the user
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


          // decode the message
          var payload = getMessageDetails(botMsg);
          if (payload) {
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
          }
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

      /*if (msg.payload.content == null) {
       node.warn("msg.payload.content is empty");
       return;
       }*/


      switch (type) {
        case 'message':

          params = {};

          console.log('mando stu cose');
          node.slackBot.postMessage(channelId, msg.payload.content, params, function() {
            console.log('fatto', arguments);
          })


          break;

        default:
        // unknown type, do nothing
      }


    });
  }
  RED.nodes.registerType('chatbot-slack-send', SlackOutNode);


};
