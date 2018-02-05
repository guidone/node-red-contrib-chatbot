var _ = require('underscore');
var moment = require('moment');
var utils = require('../lib/helpers/utils');

var when = utils.when;

const recastai = require('recastai');

module.exports = function(RED) {

  function ChatBotRecast(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.recast = config.recast;

    this.on('input', function (msg) {

      var chatId = utils.getChatId(msg);
      var context = node.context();
      var chatContext = msg.chat();

      console.log('--> ', this.recast);

      var recastNode = RED.nodes.getNode(node.recast);
      console.log('config', recastNode);

      // todo check if token is empty
      const client = new recastai.request(recastNode.credentials.token, 'en');

      var message = msg.payload.content;

      // todo check if message is text
      client.analyseText(message)
        .then(function(res) {
          console.log('--->', res);
          var task = when(true);

          if (res.intent()) {
            console.log('Intent: ', res.intent())
            console.log('all: ', res.entities)
            task = task.then(function() {
              return when(chatContext.set('topic', res.intent().slug));
            });

            task.then(
              function() {
                msg.originalMessage.entities = res.entities;
                node.send(msg);
              },
              function(e) {
                node.error(e);
              }
            )

          }
        });
    });
  }

  RED.nodes.registerType('chatbot-recast', ChatBotRecast);


  function RecastToken(n) {
    RED.nodes.createNode(this, n);
    var self = this;
    if (self.credentials != null && !_.isEmpty(self.credentials.token)) {
      //self.apiAi = apiai(self.credentials.token);
    }
  }


  RED.nodes.registerType('chatbot-recast-token', RecastToken, {
    credentials: {
      token: {
        type: 'text'
      }
    }
  });

};
