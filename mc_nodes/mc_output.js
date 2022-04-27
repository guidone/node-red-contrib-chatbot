const _ = require('lodash');

module.exports = function(RED) {

  function MissionControlOutput(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.topic = config.topic;
    this.payload = config.payload;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      let topic;
      if (!_.isEmpty(node.topic)) {
        topic = node.topic;
      } else if (!_.isEmpty(msg.topic)) {
        topic = msg.topic;
      } else if (msg.payload != null && !_.isEmpty(msg.payload.topic)) {
        topic = msg.payload.topic;
      }
      let payload;
      if (!_.isEmpty(node.payload)) {
        payload = node.payload;
      } else {
        payload = msg.payload;
      }

      try {
        payload = JSON.parse(payload);
      } catch(e) {
        // do nothing
      }

      RED.comms.publish('redbot', { topic, payload });

      // pass through
      send(msg);
      done();
    });
  }

  RED.nodes.registerType('mc-output', MissionControlOutput);
};
