var _ = require('underscore');
var clc = require('cli-color');
var utils = require('../lib/helpers/utils');
var when = utils.when;

var green = clc.greenBright;
var white = clc.white;
var grey = clc.blackBright;

module.exports = function(RED) {

  function ChatBotDebug(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.chatId = config.chatId;

    this.on('input', function(msg) {

      //var context = node.context();
      //var transport = msg.originalMessage != null && msg.originalMessage.transport != null ? msg.originalMessage.transport : null;

      //var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      if (_.isFunction(msg.chat)) {
        var chatContext = msg.chat();

        // format a little
        // eslint-disable-next-line no-console
        console.log('');
        // eslint-disable-next-line no-console
        console.log(grey('------ ChatBot debug ----------------'));
        // eslint-disable-next-line no-console
        console.log(green('Transport:'), white(chatContext.get('transport')));
        // eslint-disable-next-line no-console
        console.log(green('chatId:'), white(chatContext.get('chatId')));

        // push out context
        if (chatContext != null) {
          // eslint-disable-next-line no-console
          console.log(grey('------ ChatBot context --------------'));
          _(chatContext.all()).each(function (value, key) {
            // eslint-disable-next-line no-console
            console.log(green(key + ':'), value instanceof Buffer ? '<Buffer>' : white(value));
          });
        }
      } else {
        // normal message here
        // eslint-disable-next-line no-console
        console.log('');
        // eslint-disable-next-line no-console
        console.log(grey('------ Message ----------------'));
        if (_.isString(msg.payload)) {
          // eslint-disable-next-line no-console
          console.log(msg.payload);
        } else {
          // eslint-disable-next-line no-console
          console.log(JSON.stringify(msg.payload));
        }

      }
      // eslint-disable-next-line no-console
      console.log('');
      // show on console
      when(chatContext.all())
        .then(function(dump) {
          node.warn(dump);
        })

    });

  }

  RED.nodes.registerType('chatbot-debug', ChatBotDebug);
};
