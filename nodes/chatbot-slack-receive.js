var _ = require('underscore');
var WebClient = require('@slack/client').WebClient;
var ChatContextStore = require('../lib/chat-context-store');
var helpers = require('../lib/slack/slack');
var fs = require('fs');
var os = require('os');
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;


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
        if (!this.rtm) {
          // add realtime wrapper
          //this.rtm = new RtmClient(this.token, {logLevel: 'debug'});
          this.rtm = new RtmClient(this.token);
          this.rtm.start();
        }
      }
    }

    this.on('close', function (done) {
      self.rtm.disconnect();
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
            // todo add date
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

      //node.slackBot = this.config.slackBot;
      node.rtm = this.config.rtm;

      if (node.rtm) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});

        node.rtm.on(RTM_EVENTS.MESSAGE, function (botMsg) {

          // mark the original message with the platform
          botMsg.transport = 'slack';


          if (botMsg.type !== 'message') {
            return;
          }
          // avoid message from the bot itself
          if (botMsg.subtype === 'bot_message') {
            return;
          }

          // todo get this dinamically
          if (botMsg.user === 'U1Q04RGU9') {
            // eslint-disable-next-line no-console
            console.log('from myself exiting');
            return;
          }


          //var username = !_.isEmpty(botMsg.from.username) ? botMsg.from.username : null;
          //var username = ''; // todo fix
          var chatId = botMsg.channel;
          var channelId = botMsg.channel;
          var userId = botMsg.user;
          //var context = node.context();
          //var isAuthorized = node.config.isAuthorized(username, userId);
          var isAuthorized = true; // fix is authorized
          var chatContext = ChatContextStore.getOrCreateChatContext(this, channelId);

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
          chatContext.set('chatId', channelId);
          //chatContext.set('messageId', botMsg.message_id);
          chatContext.set('userId', userId);
          //chatContext.set('firstName', botMsg.from.first_name);
          //chatContext.set('lastName', botMsg.from.last_name);
          chatContext.set('authorized', isAuthorized);
          chatContext.set('transport', 'slack');

          // decode the message, eventually download stuff
          getMessageDetails(botMsg, node.rtm._token)
            .then(function(payload) {

              var msg = {
                payload: payload,
                originalMessage: {
                  transport: 'slack',
                  chat: {
                    id: channelId
                  }
                },
                chat: function() {
                  return ChatContextStore.getChatContext(node, chatId);
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
      node.warn('Missing configuration in Slack Receiver');
    }
  }
  RED.nodes.registerType('chatbot-slack-receive', SlackInNode);


  function SlackOutNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;


    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});

      node.rtm = this.config.rtm;

      if (node.rtm) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
      } else {
        node.warn("no bot in config.");
      }
    } else {
      node.warn("no config.");
    }

    function prepareMessage(msg) {

      return new Promise(function(resolve, reject) {

        var type = msg.payload.type;
        var rtm = node.rtm;
        var slackAPI = new WebClient(rtm._token);

        switch (type) {
          case 'action':
            rtm.sendTyping(msg.payload.chatId);
            break;

          case 'message':
            rtm.sendMessage(msg.payload.content, msg.payload.chatId);
            break;

          case 'location':
            // build link
            var link = 'https://www.google.com/maps?f=q&q=' + msg.payload.content.latitude + ','
              + msg.payload.content.longitude + '&z=16';
            // send simple attachment
            var attachments = [
              {
                'author_name': 'Position',
                'title': link,
                'title_link': link,
                'color': '#7CD197'
              }
            ];
            slackAPI.chat.postMessage(msg.payload.chatId, '', {attachments: attachments});
            break;

          case 'photo':

            var filename = msg.payload.filename || 'tmp-image-file';
            var image = msg.payload.content;
            var tmpFile = os.tmpdir() + '/' + filename;

            // write to filesystem to use stream
            fs.writeFile(tmpFile, image, function(err) {
              if (err) {
                reject(err);
              } else {
                // upload and send
                slackAPI.files.upload(
                  filename,
                  {
                    file: fs.createReadStream(tmpFile),
                    filetype: 'auto',
                    channels: msg.payload.chatId
                  }, function handleContentFileUpload() {
                  }
                );
              }
            }); // end writeFile
            break;


          default:
            reject('Unable to prepare unknown message type');
        }

      });
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

      //var channelId = msg.payload.chatId;

      //var noop = function() {};

      /*if (msg.payload.content == null) {
       node.warn("msg.payload.content is empty");
       return;
       }*/

      prepareMessage(msg)
        .then(function() {
          //node.slackBot.postMessage(channelId, obj.content, obj.params, noop);
        });





    });
  }
  RED.nodes.registerType('chatbot-slack-send', SlackOutNode);

};
