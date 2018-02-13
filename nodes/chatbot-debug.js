var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var lcd = require('../lib/helpers/lcd');
var moment = require('moment');
var when = utils.when;

module.exports = function(RED) {

  function ChatBotDebug(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.chatId = config.chatId;

    this.on('input', function(msg) {

      // cleanup payload
      var payload = null;
      if (msg.payload != null) {
        payload = _.clone(msg.payload);
        _(payload).each(function(value, key) {
          if (value instanceof Buffer) {
            payload[key] = '<Buffer>';
          } else if (value instanceof moment) {
            payload[key] = value.toString();
          }
        });
      }

      if (_.isFunction(msg.chat)) {
        var chatContext = msg.chat();
        // get all keys
        when(chatContext.all())
          .then(function(obj) {
            // chat context
            lcd.node(obj, { title: 'ChatBot debug', node: node });
            // message
            if (payload != null) {
              lcd.node(payload, {title: 'Chat message', node: node});
            }
          });
      } else {
        lcd.node(msg.payload, { title: 'Message debug', node: node });
      }
    });
  }

  RED.nodes.registerType('chatbot-debug', ChatBotDebug);
};
