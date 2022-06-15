

module.exports = function(RED) {

  const { Events } = require('./mc')(RED);

  function MissionControlInput(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.topic = config.topic;

    const handler = (topic, payload) => {
      if (topic === node.topic) {
        node.send({ topic, payload });
      }
    }

    Events.on('message', handler);

    this.on('close', done => {
      Events.removeListener('message', handler);
      done();
    });
  }


  RED.nodes.registerType('mc-input', MissionControlInput);
};
