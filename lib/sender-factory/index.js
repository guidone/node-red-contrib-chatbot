const _ = require('underscore');
const _s = require('underscore.string');
const moment = require('moment');
const { ContextProviders, ChatExpress } = require('chat-platform');
const clc = require('cli-color');
const prettyjson = require('prettyjson');
const path = require('path');

const utils = require('../../lib/helpers/utils');
const GetEnvironment = require('../../lib/helpers/get-environment');
const lcd = require('../../lib/helpers/lcd');
const validators = require('../../lib/helpers/validators');
const {
  isValidMessage,
  getTransport,
  isSimulator
} = require('../../lib/helpers/utils');
const GlobalContextHelper = require('../../lib/helpers/global-context-helper');
const StoreMessages = require('./store-messages');


const when = utils.when;
const warn = clc.yellow;
const green = clc.green;

const GenericBotNode = (
  platform,
  RED,
  factory,
  configurator,
  validator = botConfiguration => botConfiguration.token != null
) => {

  return function(n) {
    const globalContextHelper = GlobalContextHelper(RED);
    RED.nodes.createNode(this, n);
    var node = this;

    globalContextHelper.init(this.context().global);
    var environment = GetEnvironment(RED)();
    var isUsed = utils.isUsed(RED, node.id);
    var startNode = utils.isUsedInEnvironment(RED, node.id, environment);
    var platformConfigs = globalContextHelper.get(platform) || {};
    var contextProviders = ContextProviders(RED);

    this.botname = n.botname;
    this.store = n.store;
    this.log = n.log;
    this.usernames = n.usernames != null ? n.usernames.split(',') : [];
    this.polling = n.polling;
    this.providerToken = n.providerToken;
    this.debug = n.debug;
    this.webHook = n.webHook;
    this.connectMode = n.connectMode;
    this.storeMessages = n.storeMessages;
    this.enableMissionControl = n.enableMissionControl;
    this.inspectMessages = n.inspectMessages;
    this.chatbotId = n.chatbotId;

    if (!isUsed) {
      // silently exit, this node is not used
      return;
    }
    // exit if the node is not meant to be started in this environment
    if (!startNode) {
      // eslint-disable-next-line no-console
      console.log(lcd.timestamp() + warn(`${_s.capitalize(platform)} Bot ` + this.botname + ' will NOT be launched, environment is ' + environment));
      return;
    }
    // eslint-disable-next-line no-console
    console.log(green(lcd.timestamp() + `${_s.capitalize(platform)} Bot ` + this.botname + ' will be launched, environment is ' + environment));
    // get the context storage node
    const contextStorageNode = RED.nodes.getNode(this.store);
    // build the configuration object
    let botConfiguration = {
      ...configurator(n, node),
      contextProvider: contextStorageNode != null ? contextStorageNode.contextStorage : null,
      contextParams: contextStorageNode != null ? contextStorageNode.contextParams : null,
    };

    // check if there's a valid configuration in global settings
    if (platformConfigs[node.botname] != null) {
      var validation = validators.platform[platform](platformConfigs[node.botname]);
      if (validation != null) {
        /* eslint-disable no-console */
        console.log(lcd.timestamp() + '');
        console.log(lcd.timestamp() + lcd.error(`Found a ${_s.capitalize(platform)} configuration in settings.js "` + node.botname + '", but it\'s invalid.'));
        console.log(lcd.timestamp() + lcd.grey('Errors:'));
        console.log(lcd.timestamp() + prettyjson.render(validation));
        console.log(lcd.timestamp() + '');
        return;
      } else {
        console.log(lcd.timestamp() + '');
        console.log(lcd.timestamp() + lcd.grey(`Found a valid ${_s.capitalize(platform)} configuration in settings.js: "` + node.botname + '":'));
        console.log(lcd.timestamp() + prettyjson.render(platformConfigs[node.botname]));
        console.log(lcd.timestamp() + '');
        /* eslint-enable no-console */
        botConfiguration = platformConfigs[node.botname];
      }
    }
    // check if context node
    if (botConfiguration.enableMissionControl) {
      // eslint-disable-next-line no-console
      console.log(lcd.timestamp() + lcd.warn('Using Mission Control context provider (SQLite) for ' + node.botname + '.'));
      botConfiguration.contextProvider = 'sqlite';
      botConfiguration.contextParams = {
        dbPath: RED.settings.RedBot != null ? RED.settings.RedBot.dbPath : path.join(RED.settings.userDir, 'mission-control.sqlite')
      };

    } else if (botConfiguration.contextProvider == null) {
      // eslint-disable-next-line no-console
      console.log(lcd.timestamp() + lcd.warn('No context provider specified for chatbot ' + node.botname + '. Defaulting to "memory"'));
      botConfiguration.contextProvider = 'memory';
      botConfiguration.contextParams = {};
    }

    // if chat is not already there and there's a token
    if (node.chat == null && validator(botConfiguration)) {
      // check if provider exisst
      if (!contextProviders.hasProvider(botConfiguration.contextProvider)) {
        node.error(lcd.timestamp() + 'Error creating chatbot ' + this.botname + '. The context provider '
          + botConfiguration.contextProvider + ' doesn\'t exist.');
        return;
      }
      // create a factory for the context provider
      node.contextProvider = contextProviders.getProvider(
        botConfiguration.contextProvider,
        {
          ...botConfiguration.contextParams,
          id: this.store,
          chatbotId: node.chatbotId
        }
      );
      // try to start the servers
      try {
        node.contextProvider.start();
        node.chat = factory(node, botConfiguration);
        // add extensions
        RED.nodes.eachNode(function(currentNode) {
          if (currentNode.type === 'chatbot-extend' && !_.isEmpty(currentNode.codeJs)
            && currentNode.platform === platform) {
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
}


const GenericInNode = (platform, RED) => {
  const { storeInboundMessage } = StoreMessages(RED);
  const isMissionControlEnabled = require('../../lib/helpers/is-mc-enabled')(RED);

  return function(config) {
    RED.nodes.createNode(this, config);
    const globalContextHelper = GlobalContextHelper(RED);

    const node = this;
    const environment = GetEnvironment(RED)();
    let nodeGlobalKey = null;

    globalContextHelper.init(this.context().global);

    this.bot = config.bot;
    this.botProduction = config.botProduction;
    this.config = RED.nodes.getNode(environment === 'production' ? this.botProduction : this.bot);

    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});
      node.chat = this.config.chat;
      if (node.chat) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
        // set a node that will be the master node, the only node allowed to forward
        // messages to the node specified in _currentConversatioNode
        nodeGlobalKey = platform + '_master_' + this.config.id.replace('.','_');
        let isMaster = false;
        if (globalContextHelper.get(nodeGlobalKey) == null) {
          isMaster = true;
          globalContextHelper.set(nodeGlobalKey, node.id);
          // store a list of chatbots and its references
          globalContextHelper.set('chatbot_info_' + this.config.id.replace('.','_'), {
            nodeId: node.id,
            botNode: this.config.id,
            transport: platform,
            name: this.config.botname,
            chatbotId: this.config.chatbotId
          });
        }
        node.chat.on('message', async function(message) {
          const context = message.chat();
          message.redBot = { environment };
          if (isMaster) {
            // store message
            if (isMissionControlEnabled() && node.config.storeMessages) {
              await storeInboundMessage(message, node);
            }
            // send payload to ws
            if (node.config.inspectMessages) {
              RED.comms.publish('redbot', { topic: 'message.in', payload: message.payload });
            }
          }
          // check if there is a conversation is going on
          const currentConversationNode = await when(context.get(`${platform}_currentConversationNode`))
          // if there's a current converation, then the message must be forwarded
          if (currentConversationNode != null) {
            // if the current node is master, then redirect, if not master do nothing
            if (isMaster) {
              await when(context.remove(`${platform}_currentConversationNode`, `${platform}_currentConversationNode`))
              // emit message directly the node where the conversation stopped
              RED.events.emit('node:' + currentConversationNode, message);
            }
          } else {
            node.send(message);
          }
        });
      } else {
        node.warn(`Missing or incomplete configuration in ${_s.capitalize(platform)} Receiver`);
      }
    } else {
      node.warn(`Missing configuration in ${_s.capitalize(platform)} Receiver`);
    }

    this.on('close', function (done) {
      globalContextHelper.set(nodeGlobalKey, null);
      if (node.chat != null) {
        node.chat.off('message');
      }
      done();
    });
  }
};

const GenericOutNode = (platform, RED) => {
  const { storeOutboundMessage } = StoreMessages(RED);
  const isMissionControlEnabled = require('../../lib/helpers/is-mc-enabled')(RED);

  return function(config) {
    const globalContextHelper = GlobalContextHelper(RED);
    RED.nodes.createNode(this, config);
    const node = this;
    const environment = GetEnvironment(RED)();

    globalContextHelper.init(this.context().global);

    this.bot = config.bot;
    this.botProduction = config.botProduction;
    this.track = config.track;
    this.passThrough = config.passThrough;
    this.errorOutput = config.errorOutput;
    this.config = RED.nodes.getNode(environment === 'production' ? this.botProduction : this.bot);

    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});
      node.chat = this.config.chat;
      if (node.chat) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
      } else {
        node.warn(`Missing or incomplete configuration in ${_s.capitalize(platform)} Receiver`);
      }
    } else {
      node.warn(`Missing configuration in ${_s.capitalize(platform)} Receiver`);
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

    this.on('input', async function(message, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, message) };
      // check if valid message or right transport, skip also if it's simulator
      if (!isValidMessage(message, node) || getTransport(message) !== platform || isSimulator(message)) {
        done();
        return;
      }
      const context = message.chat();
      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (context != null && node.track && !_.isEmpty(node.wires[0])) {
        await when(context.set({
          [`${platform}_currentConversationNode`]: node.id,
          [`${platform}_currentConversationNode_at`]: moment()
        }));
      }
      // finally send out
      try {
        const outMessage = await node.chat.send(message);
        if (isMissionControlEnabled() && node.config.storeMessages) {
          await storeOutboundMessage(outMessage, node);
        }
        // forward if not tracking
        if (node.passThrough) {
          send(outMessage);
        }
        // send payload to ws
        if (node.config.inspectMessages) {
          RED.comms.publish('redbot', { topic: 'message.out', payload: outMessage.sentMessage });
        }
        done();
      } catch(error) {
        // if platform error, then forward the error
        if (node.errorOutput) {
          send(node.passThrough || node.track ? [null, { ...message, payload: error }] : { ...message, payload: error });
        }
        done(error);
      }
    });
  }
};

module.exports = {
  GenericOutNode,
  GenericInNode,
  GenericBotNode
};