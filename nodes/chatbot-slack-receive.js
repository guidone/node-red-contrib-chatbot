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
  var when = RED.redbot.utils.when;

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
            contextProvider: node.contextProvider
          });

          node.contextProvider.start();
          node.chat.start();
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
          when(context.get('currentConversationNode'))
            .then(function(currentConversationNode) {
              if (currentConversationNode != null) {
                // void the current conversation
                when(context.set('currentConversationNode', null))
                  .then(function() {
                    // emit message directly the node where the conversation stopped
                    RED.events.emit('node:' + currentConversationNode, message);
                  });
              } else {
                node.send(message);
              }
            });
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
      var stack = when(true);
      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (context != null && node.track && !_.isEmpty(node.wires[0])) {
        stack = stack.then(function() {
          return when(context.set({
            currentConversationNode: node.id,
            currentConversationNode_at: moment()
          }));
        });
      }
      // finally send out
      stack.then(function() {
        node.chat.send(message);
      });
    });
  }
  RED.nodes.registerType('chatbot-slack-send', SlackOutNode);

};
