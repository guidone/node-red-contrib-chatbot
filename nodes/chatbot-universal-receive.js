const _ = require('underscore');
const moment = require('moment');
const { UniversalPlatform: UniversalServer, ContextProviders, ChatExpress } = require('chat-platform');
const utils = require('../lib/helpers/utils');
const clc = require('cli-color');
const lcd = require('../lib/helpers/lcd');
const prettyjson = require('prettyjson');
const validators = require('../lib/helpers/validators');
const RegisterType = require('../lib/node-installer');

const when = utils.when;
const warn = clc.yellow;
const green = clc.green;


module.exports = function(RED) {
  const registerType = RegisterType(RED);

  // register Slack server
  if (RED.redbot == null) {
    RED.redbot = {};
  }
  if (RED.redbot.platforms == null) {
    RED.redbot.platforms = {};
  }
  RED.redbot.platforms.universal = UniversalServer;

  var contextProviders = ContextProviders(RED);

  function UniversalBotNode(n) {
    RED.nodes.createNode(this, n);
    var node = this;
    var environment = this.context().global.environment === 'production' ? 'production' : 'development';
    var isUsed = utils.isUsed(RED, node.id);
    var startNode = utils.isUsedInEnvironment(RED, node.id, environment);
    var universalConfigs = RED.settings.functionGlobalContext.get('universal') || {};

    this.botname = n.botname;
    this.store = n.store;
    this.log = n.log;
    this.connectorParams = n.connectorParams;
    this.usernames = n.usernames != null ? n.usernames.split(',') : [];
    this.polling = n.polling;
    this.providerToken = n.providerToken;
    this.debug = n.debug;

    if (!isUsed) {
      // silently exit, this node is not used
      return;
    }
    // exit if the node is not meant to be started in this environment
    if (!startNode) {
      // eslint-disable-next-line no-console
      console.log(warn('Universal Connector Bot ' + this.botname + ' will NOT be launched, environment is ' + environment));
      return;
    }
    // eslint-disable-next-line no-console
    console.log(green('Universal Connector Bot ' + this.botname + ' will be launched, environment is ' + environment));
    // get the context storage node
    var contextStorageNode = RED.nodes.getNode(this.store);
    // parse JSON config
    var connectorParams = null;
    if (!_.isEmpty(this.connectorParams))
    {
      try {
        connectorParams = JSON.parse(this.connectorParams);
      } catch (error) {
        lcd.dump(error, 'Error in JSON configuration of Universal Connector');
        // eslint-disable-next-line no-console
        console.log(lcd.red(this.connectorParams));
        // eslint-disable-next-line no-console
        console.log('');
        return;
      }
    }
    // build the configuration object
    var botConfiguration = {
      authorizedUsernames: node.usernames,
      logfile: node.log,
      contextProvider: contextStorageNode != null ? contextStorageNode.contextStorage : null,
      contextParams: contextStorageNode != null ? contextStorageNode.contextParams : null,
      debug: node.debug,
      connectorParams: connectorParams
    };
    // check if there's a valid configuration in global settings
    if (universalConfigs[node.botname] != null) {
      var validation = validators.platform.universal(universalConfigs[node.botname]);
      if (validation != null) {
        /* eslint-disable no-console */
        console.log('');
        console.log(lcd.error('Found a Universal Connector configuration in settings.js "' + node.botname + '", but it\'s invalid.'));
        console.log(lcd.grey('Errors:'));
        console.log(prettyjson.render(validation));
        console.log('');
        return;
      } else {
        console.log('');
        console.log(lcd.grey('Found a valid Universal Connector configuration in settings.js: "' + node.botname + '":'));
        console.log(prettyjson.render(universalConfigs[node.botname]));
        console.log('');
        /* eslint-enable no-console */
        botConfiguration = universalConfigs[node.botname];
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
    if (node.chat == null) {
      // check if provider exisst
      if (!contextProviders.hasProvider(botConfiguration.contextProvider)) {
        node.error('Error creating chatbot ' + this.botname + '. The context provider '
          + botConfiguration.contextProvider + ' doesn\'t exist.');
        return;
      }
      // create a factory for the context provider
      node.contextProvider = contextProviders.getProvider(
        botConfiguration.contextProvider,
        { ...botConfiguration.contextParams, id: this.store }
      );
      // try to start the servers
      try {
        node.contextProvider.start();
        node.chat = UniversalServer.createServer(_.extend(
          {
            authorizedUsernames: botConfiguration.authorizedUsernames,
            contextProvider: node.contextProvider,
            logfile: botConfiguration.logfile,
            debug: botConfiguration.debug,
            RED: RED
          },
          botConfiguration.connectorParams
        ));
        // add extensions
        RED.nodes.eachNode(function(currentNode) {
          if (currentNode.type === 'chatbot-extend' && !_.isEmpty(currentNode.codeJs)
            && currentNode.platform === 'universal') {
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
          ChatExpress.reset();
          ContextProviders.reset();
          done();
        });
    });
  }
  registerType('chatbot-universal-node', UniversalBotNode, {
    credentials: {
      token: {
        type: 'text'
      }
    }
  });

  function UniversalInNode(config) {

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
        nodeGlobalKey = 'universal_master_' + this.config.id.replace('.','_');
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

    this.on('input', function(msg) {
      if (node.chat != null) {
        node.chat.receive(msg);
      }
    });
  }
  registerType('chatbot-universal-receive', UniversalInNode);

  function UniversalOutNode(config) {
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
        return node.chat.send(message);
      }).then(function() {
        // forward if not tracking
        if (node.passThrough) {
          node.send(message);
        } else {
          const cloned = {...message};
          delete cloned.api;
          delete cloned.chat;
          delete cloned.client;
          delete cloned.originalMessage;
          node.send(cloned);
        }
      });
    });
  }
  registerType('chatbot-universal-send', UniversalOutNode);

};
