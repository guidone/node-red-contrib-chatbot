const _ = require('lodash');
const { when, isCommand } = require('../lib/utils')

const GlobalContextHelper = require('../lib/helpers/global-context-helper');
const GetConfigurationNode = require('../lib/helpers/get-configuration-node');

module.exports = function(RED) {

  const { Events } = require('./mc')(RED);
  const sendMessage = (topic, payload) => {
    RED.comms.publish('redbot', { topic, payload });
  }
  const getConfigurationNode = GetConfigurationNode(RED);

  function MissionControlSimulatorReceiver(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const globalContextHelper = GlobalContextHelper(RED);
    this.chatbotId = config.chatbotId;

    globalContextHelper.init(this.context().global);

    const nodeGlobalKey = 'simulator_master';
    let isMaster = false;
    if (globalContextHelper.get(nodeGlobalKey) == null) {
      isMaster = true;
      globalContextHelper.set(nodeGlobalKey, node.id);
    }

    const handler = async (topic, message) => {

      // only process simulator messages coming from the right chatbotId
      if (topic === 'simulator' && message != null && message.chatbotId === node.chatbotId) {
        // get the configuration node from the chatbotId
        let serverNode = getConfigurationNode(message.chatbotId);
        if (serverNode == null || serverNode.chat == null) {
          node.error(`Unable to find a RedBot chat bot with id "${message.chatbotId}"`);
          sendMessage('simulator_error', {
            message: `Unable to find a RedBot chat bot with id "${message.chatbotId}"`
          });
          return;
        }

        // get simulator options from payload
        const { echo = true } = message.simulatorOptions || {};
        const chatServer = serverNode.chat;
        const chatId = 'simulator';
        const userId = String(message.userId);
        const username = message.username;
        const language = message.language;
        const firstName = message.firstName;
        const lastName = message.lastName;
        const messageId = _.uniqueId('msg_');

        // create blank message
        const msg = await chatServer.createMessage(null, userId, messageId, {});
        const context = msg.chat();

        // set payload
        msg.payload = {
          ..._.omit(message.payload, 'simulatorOptions'),
          chatId,
          messageId,
          userId,
          inbound: true
        };
        msg.originalMessage = {
          ...msg.originalMessage,
          simulator: true,
          userId: userId,
          username: username
        }

        // store the message in context, also prepara arguments of command if any
        let text;
        if (_.isString(msg.payload.content) && !_.isEmpty(msg.payload.content)) {
          text = msg.payload.content;
          if (isCommand(msg.payload.content)) {
            msg.payload.arguments = msg.payload.content.split(' ').slice(1);
          }
        }

        await context.set({ username, language, firstName, lastName, message: text });
        context.statics = { ...context.statics, userId }; // tricky
        // send back the evaluated message so also originated messages are visible in the simulator
        if (echo) {
          sendMessage('simulator', {
            ...msg.payload,
            messageId: _.uniqueId('msg_'),
            transport: msg.originalMessage.transport,
            userId: userId,
            username: username
          });
        }

        // check if there is a conversation is going on
        const currentConversationNode = await when(context.get('simulator_currentConversationNode'));
        // if there's a current converation, then the message must be forwarded
        if (currentConversationNode != null) {
          // if the current node is master, then redirect, if not master do nothing
          if (isMaster) {
            await when(context.remove('simulator_currentConversationNode'))
            // emit message directly the node where the conversation stopped
            RED.events.emit('node:' + currentConversationNode, msg);
          }
        } else {
          // continue the flow
          node.send(msg);
        }
      }
    }
    // listen to incoming socket messages
    Events.on('message', handler);

    this.on('close', done => {
      Events.removeListener('message', handler);
      done();
    });
  }

  RED.nodes.registerType('mc-simulator-receiver', MissionControlSimulatorReceiver);
};
