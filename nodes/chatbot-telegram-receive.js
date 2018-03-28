var _ = require('underscore');
var moment = require('moment');
var TelegramServer = require('../lib/telegram/telegram-chat');
var ContextProviders = require('../lib/chat-platform/chat-context-factory');
var utils = require('../lib/helpers/utils');
var clc = require('cli-color');

var when = utils.when;
var warn = clc.yellow;
var green = clc.green;

module.exports = function(RED) {

  // register Slack server
  if (RED.redbot == null) {
    RED.redbot = {};
  }
  if (RED.redbot.platforms == null) {
    RED.redbot.platforms = {};
  }
  RED.redbot.platforms.telegram = TelegramServer;

  var contextProviders = ContextProviders(RED);

  function TelegramBotNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    var environment = this.context().global.environment === 'production' ? 'production' : 'development';
    var isUsed = utils.isUsed(RED, node.id);
    var startNode = utils.isUsedInEnvironment(RED, node.id, environment);

    this.botname = n.botname;
    this.store = n.store;
    this.log = n.log;
    this.usernames = n.usernames != null ? n.usernames.split(',') : [];
    this.polling = n.polling;
    this.parseMode = n.parseMode;

    if (!isUsed) {
      // silently exit, this node is not used
      return;
    }
    // exit if the node is not meant to be started in this environment
    if (!startNode) {
      // eslint-disable-next-line no-console
      console.log(warn('Telegram Bot ' + this.botname + ' will NOT be launched, environment is ' + environment));
      return;
    }
    // eslint-disable-next-line no-console
    console.log(green('Telegram Bot ' + this.botname + ' will be launched, environment is ' + environment));

    if (this.credentials) {
      this.token = this.credentials.token;
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
            node.chat = TelegramServer.createServer({
              authorizedUsernames: node.usernames,
              token: node.token,
              polling: node.polling,
              parseMode: node.parseMode,
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
    var global = this.context().global;
    var environment = global.environment === 'production' ? 'production' : 'development';
    var nodeGlobalKey = null;

    this.bot = config.bot;
    this.botProduction = config.botProduction;
    this.config = RED.nodes.getNode(environment === 'production' ? this.botProduction : this.bot);

    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});
      node.chat = this.config.chat;
      if (node.chat) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
        nodeGlobalKey = 'telegram_master_' + this.config.id.replace('.','_');
        var isMaster = false;
        if (global.get(nodeGlobalKey) == null) {
          isMaster = true;
          global.set(nodeGlobalKey, node.id);
        }
        node.chat.on('message', function (message) {
          var context = message.chat();
          // if a conversation is going on, go straight to the conversation node, otherwise if authorized
          // then first pin, if not second pin
          when(context.get('currentConversationNode'))
            .then(function(currentConversationNode) {
              if (isMaster && currentConversationNode != null) {
                // if the current node is master, then redirect
                // void the current conversation
                when(context.remove('currentConversationNode'))
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
        node.warn('Missing or incomplete configuration in Telegram Receiver');
      }
    } else {
      node.warn('Missing configuration in Telegram Receiver');
    }

    this.on('close', function (done) {
      node.context().global.set(nodeGlobalKey, null);
      if (node.chat != null) {
        node.chat.off('message');
      }
      done();
    });
  }
  RED.nodes.registerType('chatbot-telegram-receive', TelegramInNode);

  function TelegramOutNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var global = this.context().global;
    var environment = global.environment === 'production' ? 'production' : 'development';

    this.bot = config.bot;
    this.botProduction = config.botProduction;
    this.track = config.track;
    this.config = RED.nodes.getNode(environment === 'production' ? this.botProduction : this.bot);

    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});
      node.chat = this.config.chat;
      if (node.chat) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
      } else {
        node.warn('Missing or incomplete configuration in Telegram Receiver');
      }
    } else {
      node.warn('Missing configuration in Telegram Receiver');
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
  RED.nodes.registerType('chatbot-telegram-send', TelegramOutNode);

};
