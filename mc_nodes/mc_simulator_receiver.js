const _ = require('lodash');
const { when, isCommand } = require('../lib/utils')

module.exports = function(RED) {

  const { Events, sendMessage } = require('./mc')(RED);

  function MissionControlSimulatorReceiver(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.topic = config.topic;

    const global = this.context().global;
    nodeGlobalKey = 'simulator_master';
    let isMaster = false;
    console.log('Starting simulator receiver ', node.id)
    if (global.get(nodeGlobalKey) == null) {
      isMaster = true;
      global.set(nodeGlobalKey, node.id);
      console.log('   ->   is master ', node.id)
    }



    const handler = async (topic, message) => {
      if (topic === 'simulator') {

        const serverNode = RED.nodes.getNode(message.nodeId);


        if (serverNode == null || serverNode.chat == null) {
          node.error(`Unable to find a RedBot chat node with id ${message.nodeId}`);
          return;
        }

        // get simulator options from payload
        const { echo = true } = message.simulatorOptions || {};
        //console.log('ecoho', echo)
        const chatServer = serverNode.chat;
        const chatId = 'sim42'; // TODO: fix chat id with something meaningful
        const userId = String(message.userId); // TODO: select right userid
        const username = message.username;
        const language = message.language;
        const firstName = message.firstName;
        const lastName = message.lastName;
        const messageId = _.uniqueId('msg_');
        const msg = await chatServer.createMessage(chatId, userId, messageId, {});
        const context = msg.chat();

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
