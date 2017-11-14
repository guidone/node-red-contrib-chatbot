var _ = require('underscore');
var moment = require('moment');

var ChatContextStore = require('../lib/chat-context-store');

var RtmClient = require('@slack/client').RtmClient;
var WebClient = require('@slack/client').WebClient;
var SlackServer = require('../lib/slack/slack-chat');
var ContextProviders = require('../lib/chat-platform/chat-context-factory');

module.exports = function(RED) {

  // register Slack server
  if (RED.redbot == null) {
    RED.redbot = {};
  }
  if (RED.redbot.platforms == null) {
    RED.redbot.platforms = {};
  }
  RED.redbot.platforms.slack = SlackServer;

  var contextProviders = ContextProviders(RED);
  console.log('context providers -> ', contextProviders.getProviders());


  function SlackBotNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;

    this.botname = n.botname;
    this.store = n.store;

    // todo move this
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
          // get the context storage node
          var contextStorageNode = RED.nodes.getNode(this.store);
          // check if provider exisst
          if (!contextProviders.hasProvider(contextStorageNode.contextStorage)) {
            node.error('Error creating chatbot ' + this.botname+ '. The context provider '
              + contextStorageNode.contextStorage + ' doesn\'t exist.');
            return;
          }
          // create a factory for the context provider
          node.contextProvider = contextProviders.getProvider(
            contextStorageNode.contextStorage,
            contextStorageNode.contextParams
          );
          console.log('Init slack rtm con ', node.token);

          var rtm = new RtmClient(node.token);
          rtm.start(); // todo move this on start
          var client = new WebClient(node.token);
          node.chat = SlackServer.createServer({
            botname: node.botname,
            client: client,
            connector: rtm,
            contextProvider: node.contextProvider,

            store: ChatContextStore // todo remove
          });

          node.contextProvider.start();
        }
      }
    }

    this.on('close', function (done) {
      node.chat.close()
        .then(function() {
          return node.contextProvider.stop();
        })
        .then(function() {
          node.chat = null;
          done();
        });
    });

    // todo move this inside the slack chat
    this.isAuthorized = function (username, userId) {
      if (node.usernames.length > 0) {
        return node.usernames.indexOf(username) != -1 || node.usernames.indexOf(String(userId)) != -1;
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
          // if a conversation is going on, go straight to the conversation node, otherwise if authorized
          // then first pin, if not second pin
          var currentConversationNode = context.get('currentConversationNode');
          if (currentConversationNode != null) {
            // void the current conversation
            context.set('currentConversationNode', null);
            // emit message directly the node where the conversation stopped
            RED.events.emit('node:' + currentConversationNode, message);
          } else {
            node.send(message);
          }
        });

        // handle error on sl6teack chat server
        node.chat.on('error', function(error) {
          node.error('[SLACK] ' + error);
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
    this.track = config.track;

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


    // relay message
    var handler = function(msg) {
      node.send(msg);
    };
    RED.events.on('node:' + config.id, handler);

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });

    this.on('input', function (message) {

      var context = message.chat();

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (context != null && node.track && !_.isEmpty(node.wires[0])) {
        context.set('currentConversationNode', node.id);
        context.set('currentConversationNode_at', moment());
      }

      node.chat.send(message);


      // todo move this to chat platform
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



    });
  }
  RED.nodes.registerType('chatbot-slack-send', SlackOutNode);

};
