const _ = require('lodash');
const moment = require('moment');

const { when } = require('../lib/utils');

module.exports = function(RED) {

  const sendMessage = (topic, payload) => {
    RED.comms.publish('redbot', { topic, payload });
  }

  function MissionControlSimulatorSender(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.track = config.track;
    this.passThrough = config.passThrough;
    this.chatbotId = config.chatbotId;

    // relay message
    const handleConversation = function(msg) {
      node.send(msg);
    };
    RED.events.on('node:' + config.id, handleConversation);

    // cleanup on close
    this.on('close', function() {
      RED.events.removeListener('node:' + config.id, handleConversation);
    });

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const context = msg.chat();
      // skip messages not from the simulator and from the right chatbotId
      if (!msg.originalMessage.simulator && msg.originalMessage.chatbotId !== node.chatbotId) {
        done();
        return;
      }
      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (context != null && node.track && !_.isEmpty(node.wires[0])) {
        await when(context.set({
          simulator_currentConversationNode: node.id,
          simulator_currentConversationNode_at: moment()
        }));
      }

      if (_.isArray(msg.payload)) {
        const payload = msg.payload.map(payload => ({ ...payload, messageId: _.uniqueId('msg_') }));
        sendMessage('simulator', {
          payload,
          inbound: false,
          userId: msg.originalMessage.userId,
          username: msg.originalMessage.username,
          transport: msg.originalMessage.transport
        });
      } else {
        const payload = { ...msg.payload, messageId: _.uniqueId('msg_') };
        sendMessage('simulator', {
          ...payload,
          inbound: false,
          userId: msg.originalMessage.userId,
          username: msg.originalMessage.username,
          transport: msg.originalMessage.transport
        });
      }

      // forward if pass thru
      if (node.passThrough) {
        send(msg);
      }
      done();
    });
  }

  RED.nodes.registerType('mc-simulator-sender', MissionControlSimulatorSender);
};
