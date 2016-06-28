var _ = require('underscore');
var moment = require('moment');

module.exports = function(RED) {

  function ChatBotLog(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.on('input', function(msg) {

      var context = node.context();
      var firstName = context.flow.get('firstName');
      var lastName = context.flow.get('lastName');
      var inbound = msg.payload != null && msg.payload.inbound === true;

      var name = [];
      if (firstName != null ) {
        name.push(firstName);
      }
      if (lastName != null ) {
        name.push(lastName);
      }

      if (msg.payload != null && typeof msg.payload == 'object') {
        var logString = null;
        switch(msg.payload.type) {
          case 'message':
            logString = msg.payload.content;
            break;
          case 'location':
            logString = 'latitude: ' + msg.payload.content.latitude + ' longitude: ' + msg.payload.content.latitude;
            break;
        }
        // sends out
        if (logString != null) {
          node.send({
            payload: (inbound ? '> ' : '< ')
              + (!_.isEmpty(name) ? '[' + name.join(' ') + '] ' : '')
              + moment().toString() + ' - ' + logString
          });
        }
      }

    });
  }
  RED.nodes.registerType('chatbot-log', ChatBotLog);

};
