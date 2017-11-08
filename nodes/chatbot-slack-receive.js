var _ = require('underscore');
var WebClient = require('@slack/client').WebClient;
var ChatContextStore = require('../lib/chat-context-store');
var helpers = require('../lib/slack/slack');
var fs = require('fs');
var os = require('os');
var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;




var SlackServer = require('../lib/slack/slack-chat');

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
        if (!this.chat) {
          // add realtime wrapper
          //this.rtm = new RtmClient(this.token, {logLevel: 'debug'});
          console.log('Init slack rtm con ', this.token);
          var rtm = new RtmClient(this.token);
          rtm.start();

          this.chat = SlackServer.createServer({
            connector: rtm,
            store: ChatContextStore
          });
          // handle error on slack chat server
          this.chat.on('error', function(error) {
            self.error('[SLACK] ' + error);
          });
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

  function SlackInNode(config) {

    RED.nodes.createNode(this, config);
    var node = this;
    this.bot = config.bot;

    this.config = RED.nodes.getNode(this.bot);

    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});

      //node.slackBot = this.config.slackBot;
      node.chat = this.config.chat;

      if (node.chat) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});

        node.chat.on('message', function (message) {
          var context = message.chat();
          context.dump();
          // todo jump to node
          node.send(message);

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

      node.chat = this.config.chat;

      if (node.chat) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
      } else {
        node.warn("no bot in config.");
      }
    } else {
      node.warn("no config.");
    }

    /*function prepareMessage(msg) {

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
    }*/


    this.on('input', function (message) {

      node.chat.send(message);

      /*if (msg.payload == null) {
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
      }*/

      //var channelId = msg.payload.chatId;

      //var noop = function() {};

      /*if (msg.payload.content == null) {
       node.warn("msg.payload.content is empty");
       return;
       }*/

      //prepareMessage(msg)
        //.then(function() {
          //node.slackBot.postMessage(channelId, obj.content, obj.params, noop);
        //});





    });
  }
  RED.nodes.registerType('chatbot-slack-send', SlackOutNode);

};
