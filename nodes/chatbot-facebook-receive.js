var _ = require('underscore');
var moment = require('moment');
var FacebookServer = require('../lib/facebook/facebook-chat');
var ContextProviders = require('../lib/chat-platform/chat-context-factory');
var utils = require('../lib/helpers/utils');
var when = utils.when;

module.exports = function(RED) {

  // register Slack server
  if (RED.redbot == null) {
    RED.redbot = {};
  }
  if (RED.redbot.platforms == null) {
    RED.redbot.platforms = {};
  }
  RED.redbot.platforms.facebook = FacebookServer;

  var contextProviders = ContextProviders(RED);

  function FacebookBotNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;

    this.botname = n.botname;
    this.store = n.store;
    this.log = n.log;
    this.usernames = n.usernames != null ? n.usernames.split(',') : [];

    if (this.credentials) {
      this.token = this.credentials.token;
      this.verify_token = this.credentials.verify_token;
      this.app_secret = this.credentials.app_secret;
      if (this.token) {
        this.token = this.token.trim();
        if (!this.chat) {
          // get the context storage node
          var contextStorageNode = RED.nodes.getNode(this.store);
          var contextStorage = null;
          var contextParams = null;
          // check if context node
          if (contextStorageNode != null) {
            contextStorage = contextStorageNode.contextStorage;
            contextParams = contextStorageNode.contextParams;
          } else {
            contextStorage = 'memory';
            contextParams = {};
            node.error('No context provider specified for chatbot ' + this.botname + '. Defaulting to "memory"');
          }
          // check if provider exisst
          if (!contextProviders.hasProvider(contextStorage)) {
            node.error('Error creating chatbot ' + this.botname+ '. The context provider '
              + contextStorage + ' doesn\'t exist.');
            return;
          }
          // create a factory for the context provider
          node.contextProvider = contextProviders.getProvider(contextStorage, contextParams);
          // try to start the servers
          try {
            node.contextProvider.start();
            node.chat = FacebookServer.createServer({
              authorizedUsernames: node.usernames,
              token: node.token,
              verifyToken: node.verify_token,
              appSecret: node.app_secret,
              contextProvider: node.contextProvider,
              logfile: node.log,
              RED: RED
            });
            node.chat.start();
            // handle error on sl6teack chat server
            node.chat.on('error', function(error) {
              node.error(error);
            });
            node.chat.on('warning', function(warning) {
              node.warn(warning);
            });
          } catch(e) {
            node.error(e);
          }
        }
      }
    }

    this.on('close', function (done) {
      node.chat.stop()
        .then(function() {
          return node.contextProvider.stop();
        })
        .then(function() {
          node.chat = null;
          node.contextProvider = null;
          done();
        });
    });
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


      } else {
        node.warn("no bot in config.");
      }
    } else {
      node.warn('Missing configuration in Facebook Receiver');
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
      var context = _.isFunction(message.chat) ? message.chat() : null;
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
  RED.nodes.registerType('chatbot-facebook-send', FacebookOutNode);

};
