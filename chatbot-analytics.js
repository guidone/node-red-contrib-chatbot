var _ = require('underscore');

var analytics = {
  dashbot: require('./lib/analytics/dashbot')
};

module.exports = function(RED) {

  function ChatBotAnalytics(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.platform = config.platform;
    this.token = config.token;

    this.on('input', function(msg) {

      // https://www.dashbot.io/sdk/generic

      var platform = node.platform;
      var token = node.token;

      var Service = analytics[platform];
      if (Service == null) {
        node.error('Analytics service [' + platform + '] doesn\'t exist');
        return;
      }

      var service = new Service({token: token});
      var inbound = msg.payload.inbound;

      service[inbound ? 'inbound' : 'outbound'](msg)
        .then(
          function(msg) {
            node.send(msg);
          },
          function() {
            // send through the message in any case
            node.error('Error trying to contact analytics server', {
              chatId: msg.payload.chatId,
              description: 'Error trying to contact analytics server'
            });
            node.send(msg);
          }
        );

    });
  }
  RED.nodes.registerType('chatbot-analytics', ChatBotAnalytics);

};
