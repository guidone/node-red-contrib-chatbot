var _ = require('underscore');
var clc = require('cli-color');

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
        console.log('');
        console.log(grey('------ ChatBot debug ----------------'));
        console.log(green('Transport:'), white(chatContext.get('transport')));
        console.log(green('chatId:'), white(chatContext.get('chatId')));

        // push out context
        if (chatContext != null) {
          console.log(grey('------ ChatBot context --------------'));
          _(chatContext.all()).each(function (value, key) {
            console.log(green(key + ':'), value instanceof Buffer ? '<Buffer>' : white(value));
          });
        }
      } else {
        // normal message here
        console.log('');
        console.log(grey('------ Message ----------------'));
        if (_.isString(msg.payload)) {
          console.log(msg.payload);
        } else {
          console.log(JSON.stringify(msg.payload));
        }

      }
      console.log('');
      // show on console
      node.warn(chatContext.all());
    });

  }

  RED.nodes.registerType('chatbot-debug', ChatBotDebug);
};
