var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotDispatch(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.parseType = config.parseType;
    this.parseVariable = config.parseVariable;

    this.on('input', function(msg) {

      var nodeId = '1999dbc1.8befb4';
      RED.events.emit('node:' + nodeId,msg);

      //node.send(msg);

    });
  }
  RED.nodes.registerType('chatbot-dispatch', ChatBotDispatch);

};
