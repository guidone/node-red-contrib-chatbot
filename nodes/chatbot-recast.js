var _ = require('underscore');
var utils = require('../lib/helpers/utils');
const recastai = require('recastai');
var clc = require('cli-color');

var when = utils.when;
var warn = clc.yellow;
var green = clc.green;

module.exports = function(RED) {

  function ChatBotRecast(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.recast = config.recast;
    node.language = config.language;

    this.on('input', function (msg) {

      var chatContext = msg.chat();
      var recastNode = RED.nodes.getNode(node.recast);

      // exit if empty credentials
      if (recastNode == null || recastNode.credentials == null || _.isEmpty(recastNode.credentials.token)) {
        warn('Recast.ai token is missing.');
        return;
      }
      const client = new recastai.request(recastNode.credentials.token, 'en');
      // exit if not message
      if (!utils.message.isMessage(msg)) {
        node.send([null, msg]);
        return;
      }
      // call recast
      client.analyseText(msg.payload.content)
        .then(function(res) {

          if (res.intent()) {
            var task = when(true);
            // evaluate returned entities
            var entities = {};
            _(res.entities).each(function(value, key) {
              if (_.isArray(value) && !_.isEmpty(value)) {
                if (key === 'number') {
                  entities[key] = value[0].scalar;
                } else if (key === 'datetime') {
                  entities[key] = moment(value[0].iso);
                } else {
                  entities[key] = value[0].raw;
                }
              }
            });
            // store the topic
            task = task.then(function() {
              return when(chatContext.set('topic', res.intent().slug));
            });
            // pass thru
            task.then(
              function() {
                msg.payload = entities;
                node.send([msg, null]);
              },
              function(e) {
                node.error(e);
              }
            );
          } else {
            // if didn't matched any intent
            node.send([null, msg]);
          }
        }, function(e) {
          node.error(e);
        });
    });
  }

  RED.nodes.registerType('chatbot-recast', ChatBotRecast);


  function RecastToken(n) {
    RED.nodes.createNode(this, n);
    var self = this;
    //if (self.credentials != null && !_.isEmpty(self.credentials.token)) {
      //self.apiAi = apiai(self.credentials.token);
    //}
  }


  RED.nodes.registerType('chatbot-recast-token', RecastToken, {
    credentials: {
      token: {
        type: 'text'
      }
    }
  });

};
