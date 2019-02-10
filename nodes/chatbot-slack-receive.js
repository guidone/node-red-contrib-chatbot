var _ = require('underscore');
var moment = require('moment');
var SlackServer = require('../lib/platforms/slack');
var ContextProviders = require('../lib/chat-platform/chat-context-factory');
var utils = require('../lib/helpers/utils');
var clc = require('cli-color');
var lcd = require('../lib/helpers/lcd');
var prettyjson = require('prettyjson');
var validators = require('../lib/helpers/validators');

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
  RED.redbot.platforms.slack = SlackServer;

  var contextProviders = ContextProviders(RED);

  function SlackBotNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    var environment = this.context().global.environment === 'production' ? 'production' : 'development';
    var isUsed = utils.isUsed(RED, node.id);
    var startNode = utils.isUsedInEnvironment(RED, node.id, environment);
    var slackConfigs = RED.settings.functionGlobalContext.get('slack') || {};

    this.botname = n.botname;
    this.store = n.store;
    this.log = n.log;
    this.username = n.username;
    this.iconEmoji = n.iconEmoji;
    this.debug = n.debug;
    this.usernames = n.usernames != null ? n.usernames.split(',') : [];

    if (!isUsed) {
      // silently exit, this node is not used
      return;
    }
    // exit if the node is not meant to be started in this environment
    if (!startNode) {
      // eslint-disable-next-line no-console
      console.log(warn('Slack Bot ' + this.botname + ' will NOT be launched, environment is ' + environment));
      return;
    }
    // eslint-disable-next-line no-console
    console.log(green('Slack Bot ' + this.botname + ' will be launched, environment is ' + environment));
    // get the context storage node
    var contextStorageNode = RED.nodes.getNode(this.store);
    // build the configuration object
    var botConfiguration = {
      botname: node.botname,
      token: node.credentials != null && node.credentials.token != null ? node.credentials.token.trim() : null,
      oauthToken: node.credentials != null && node.credentials.oauthToken != null ? node.credentials.oauthToken.trim() : null,
      contextProvider: contextStorageNode != null ? contextStorageNode.contextStorage : null,
      contextParams: contextStorageNode != null ? contextStorageNode.contextParams : null,
      debug: node.debug,
      logfile: node.log,
      username: node.username,
      iconEmoji: node.iconEmoji
    };
    // check if there's a valid configuration in global settings
    if (slackConfigs[node.botname] != null) {
      var validation = validators.platform.slack(slackConfigs[node.botname]);
      if (validation != null) {
        /* eslint-disable no-console */
        console.log('');
        console.log(lcd.error('Found a Slack configuration in settings.js "' + node.botname + '", but it\'s invalid.'));
        console.log(lcd.grey('Errors:'));
        console.log(prettyjson.render(validation));
        console.log('');
        return;
      } else {
        console.log('');
        console.log(lcd.grey('Found a valid Slack configuration in settings.js: "' + node.botname + '":'));
        console.log(prettyjson.render(slackConfigs[node.botname]));
        console.log('');
        /* eslint-enable no-console */
        botConfiguration = slackConfigs[node.botname];
      }
    }
    // check if context node
    if (botConfiguration.contextProvider == null) {
      // eslint-disable-next-line no-console
      console.log(lcd.warn('No context provider specified for chatbot ' + node.botname + '. Defaulting to "memory"'));
      botConfiguration.contextProvider = 'memory';
      botConfiguration.contextParams = {};
    }
    // if chat is not already there and there's a token
    if (node.chat == null && botConfiguration.token != null) {
      // check if provider exisst
      if (!contextProviders.hasProvider(botConfiguration.contextProvider)) {
        node.error('Error creating chatbot ' + node.botname + '. The context provider '
          + botConfiguration.contextProvider + ' doesn\'t exist.');
        return;
      }
      // create a factory for the context provider
      node.contextProvider = contextProviders.getProvider(botConfiguration.contextProvider, botConfiguration.contextParams);
      // try to start the servers
      try {
        node.contextProvider.start();
        node.chat = SlackServer.createServer({
          botname: botConfiguration.botname,
          authorizedUsernames: botConfiguration.usernames,
          token: botConfiguration.token,
          oauthToken : botConfiguration.oauthToken,
          contextProvider: node.contextProvider,
          logfile: botConfiguration.logfile,
          debug: botConfiguration.debug,
          username: botConfiguration.username,
          iconEmoji: botConfiguration.iconEmoji,
          RED: RED
        });
        // add extensions
        RED.nodes.eachNode(function(currentNode) {
          if (currentNode.type === 'chatbot-extend' && !_.isEmpty(currentNode.codeJs)
            && currentNode.platform === 'slack') {
            try {
              eval(currentNode.codeJs);
            } catch (e) {
              lcd.node(currentNode.codeJs, {
                color: lcd.red,
                node: currentNode,
                title: 'Syntax error in Extend Chat Server node'
              });
            }
          }
        });
        // finally launch it
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
  RED.nodes.registerType('chatbot-slack-node', SlackBotNode, {
    credentials: {
      token: {
        type: 'text'
      },
      oauthToken: {
        type: 'text'
      }
    }
  });

  function SlackInNode(config) {

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
        nodeGlobalKey = 'slack_master_' + this.config.id.replace('.','_');
        var isMaster = false;
        if (global.get(nodeGlobalKey) == null) {
          isMaster = true;
          global.set(nodeGlobalKey, node.id);
        }
        node.chat.on('message', function (message) {
          var context = message.chat();
          // check if there is a conversation is going on
          when(context.get('currentConversationNode'))
            .then(function(currentConversationNode) {
              // if there's a current converation, then the message must be forwarded
              if (currentConversationNode != null) {
                // if the current node is master, then redirect, if not master do nothing
                if (isMaster) {
                  when(context.remove('currentConversationNode'))
                    .then(function () {
                      // emit message directly the node where the conversation stopped
                      RED.events.emit('node:' + currentConversationNode, message);
                    });
                }
              } else {
                node.send(message);
              }
            });
        });
      } else {
        node.warn('Missing or incomplete configuration in Slack Receiver');
      }
    } else {
      node.warn('Missing configuration in Slack Receiver');
    }

    this.on('close', function (done) {
      node.context().global.set(nodeGlobalKey, null);
      if (node.chat != null) {
        node.chat.off('message');
      }
      done();
    });
  }
  RED.nodes.registerType('chatbot-slack-receive', SlackInNode);

  function SlackOutNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var global = this.context().global;
    var environment = global.environment === 'production' ? 'production' : 'development';

    this.bot = config.bot;
    this.botProduction = config.botProduction;
    this.track = config.track;
    this.passThrough = config.passThrough;
    this.config = RED.nodes.getNode(environment === 'production' ? this.botProduction : this.bot);

    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});
      node.chat = this.config.chat;
      if (node.chat) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
      } else {
        node.warn('Missing or incomplete configuration in Slack Receiver');
      }
    } else {
      node.warn('Missing configuration in Slack Receiver');
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
        return node.chat.send(message);
      }).then(function() {
        // forward if not tracking
        if (node.passThrough) {
          node.send(message);
        }
      });
    });
  }
  RED.nodes.registerType('chatbot-slack-send', SlackOutNode);

};
