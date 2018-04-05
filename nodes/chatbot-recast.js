var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var recastai = require('recastai');
var moment = require('moment');
var lcd = require('../lib/helpers/lcd');

var when = utils.when;

module.exports = function(RED) {

  function ChatBotRecast(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.recast = config.recast;
    node.language = config.language;
    node.debug = config.debug;
    node.variable = config.variable;

    this.on('input', function (msg) {

      var chatContext = msg.chat();
      var recastNode = RED.nodes.getNode(node.recast);
      var language = utils.extractValue('string', 'language', node, msg, false);
      var debug = utils.extractValue('boolean', 'debug', node, msg, false);
      var variable = utils.extractValue('string', 'variable', node, msg, false);

      // exit if empty credentials
      if (recastNode == null || recastNode.credentials == null || _.isEmpty(recastNode.credentials.token)) {
        lcd.warn('Recast.ai token is missing.');
        return;
      }
      var client = new recastai.request(recastNode.credentials.token, language.toLowerCase());
      // exit if not message
      if (!utils.message.isMessage(msg)) {
        node.send([null, msg]);
        return;
      }

      var variables = null;
      var intent = null;

      // call recast
      client.analyseText(msg.payload.content)
        .then(function(res) {
          if (res.intent()) {
            // evaluate returned entities
            intent = res.intent().slug;
            variables = {};
            _(res.entities).each(function(value, key) {
              if (_.isArray(value) && !_.isEmpty(value)) {
                if (key === 'number') {
                  variables[key] = value[0].scalar;
                } else if (key === 'datetime') {
                  variables[key] = moment(value[0].iso);
                } else {
                  variables[key] = value[0].raw;
                }
              }
            });
            // store new topic
            return when(!_.isEmpty(variable) ? chatContext.set(variable, intent) : true);
          } else {
            // if didn't matched any intent, relay to 2nd output and stop here
            if (debug) {
              lcd.node('No match', { node: node, title: 'Recast.ai' });
            }
            node.send([null, msg]);
            return Promise.reject();
          }
        })
        .then(function() {
          msg.payload = {
            variables: variables,
            intent: intent
          };
          if (debug) {
            lcd.node(msg.payload, { node: node, title: 'Recast.ai' });
          }
          node.send([msg, null]);
        })
        .catch(function(e) {
          if (e != null) {
            node.error(e, msg);
          }
        });
    });
  }

  RED.nodes.registerType('chatbot-recast', ChatBotRecast);

  function RecastToken(n) {
    RED.nodes.createNode(this, n);
  }

  RED.nodes.registerType('chatbot-recast-token', RecastToken, {
    credentials: {
      token: {
        type: 'text'
      }
    }
  });

};
