const _ = require('underscore');
const _s = require('underscore.string');
const moment = require('moment');
const TelegramServer = require('../lib/platforms/telegram');
const { ContextProviders, ChatExpress } = require('chat-platform');
const utils = require('../lib/helpers/utils');
const clc = require('cli-color');
const lcd = require('../lib/helpers/lcd');
const prettyjson = require('prettyjson');
const validators = require('../lib/helpers/validators');
const RegisterType = require('../lib/node-installer');

const {
  isValidMessage,
  getTransport
} = require('../lib/helpers/utils');

const when = utils.when;
const warn = clc.yellow;
const green = clc.green;

const { GenericOutNode, GenericInNode, GenericBotNode } = require('../lib/sender-factory');


module.exports = function(RED) {
  const registerType = RegisterType(RED);

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
    var telegramConfigs = RED.settings.functionGlobalContext.get('telegram') || {};

    this.botname = n.botname;
    this.store = n.store;
    this.log = n.log;
    this.usernames = n.usernames != null ? n.usernames.split(',') : [];
    this.polling = n.polling;
    this.providerToken = n.providerToken;
    this.debug = n.debug;
    this.webHook = n.webHook;
    this.connectMode = n.connectMode;

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
    // get the context storage node
    var contextStorageNode = RED.nodes.getNode(this.store);
    // build the configuration object
    var botConfiguration = {
      authorizedUsernames: node.usernames,
      token: node.credentials != null && node.credentials.token != null ? node.credentials.token.trim() : null,
      providerToken: node.providerToken,
      polling: node.polling,
      logfile: node.log,
      contextProvider: contextStorageNode != null ? contextStorageNode.contextStorage : null,
      contextParams: contextStorageNode != null ? contextStorageNode.contextParams : null,
      debug: node.debug,
      webHook: node.webHook,
      connectMode: node.connectMode
    };
    // check if there's a valid configuration in global settings
    if (telegramConfigs[node.botname] != null) {
      var validation = validators.platform.telegram(telegramConfigs[node.botname]);
      if (validation != null) {
        /* eslint-disable no-console */
        console.log('');
        console.log(lcd.error('Found a Telegram configuration in settings.js "' + node.botname + '", but it\'s invalid.'));
        console.log(lcd.grey('Errors:'));
        console.log(prettyjson.render(validation));
        console.log('');
        return;
      } else {
        console.log('');
        console.log(lcd.grey('Found a valid Telegram configuration in settings.js: "' + node.botname + '":'));
        console.log(prettyjson.render(telegramConfigs[node.botname]));
        console.log('');
        /* eslint-enable no-console */
        botConfiguration = telegramConfigs[node.botname];
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
        node.chat = TelegramServer.createServer({
          authorizedUsernames: botConfiguration.authorizedUsernames,
          token: botConfiguration.token,
          providerToken: botConfiguration.providerToken,
          polling: botConfiguration.polling,
          contextProvider: node.contextProvider,
          logfile: botConfiguration.logfile,
          debug: botConfiguration.debug,
          webHook: botConfiguration.webHook,
          connectMode: botConfiguration.connectMode,
          RED: RED
        });
        // add extensions
        RED.nodes.eachNode(function(currentNode) {
          if (currentNode.type === 'chatbot-extend' && !_.isEmpty(currentNode.codeJs)
            && currentNode.platform === 'telegram') {
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

  registerType(
    'chatbot-telegram-node',
    TelegramBotNode,
    {
      credentials: {
        token: {
          type: 'text'
        }
      }
    }
  );

  /*registerType(
    'chatbot-telegram-node',
    GenericBotNode(
      'telegram',
      RED,
      (node, botConfiguration) => {
        return TelegramServer.createServer({
          authorizedUsernames: botConfiguration.authorizedUsernames,
          token: botConfiguration.token,
          providerToken: botConfiguration.providerToken,
          polling: botConfiguration.polling,
          contextProvider: node.contextProvider,
          logfile: botConfiguration.logfile,
          debug: botConfiguration.debug,
          webHook: botConfiguration.webHook,
          connectMode: botConfiguration.connectMode,
          RED: RED
        });
      },
      node => ({
        authorizedUsernames: node.usernames,
        token: node.credentials != null && node.credentials.token != null ? node.credentials.token.trim() : null,
        providerToken: node.providerToken,
        polling: node.polling,
        logfile: node.log,
        debug: node.debug,
        webHook: node.webHook,
        connectMode: node.connectMode
      })
    ),
    {
      credentials: {
        token: {
          type: 'text'
        }
      }
    }
  );*/

  /*function TelegramInNode(config) {

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
          // store a list of chatbots and its references
          global.set('chatbot_info_' + this.config.id.replace('.','_'), {
            nodeId: node.id,
            transport: 'telegram',
            name: this.config.botname
          });
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
  }*/
  registerType('chatbot-telegram-receive', GenericInNode('telegram', RED));

  registerType('chatbot-telegram-send', GenericOutNode('telegram', RED));
};
