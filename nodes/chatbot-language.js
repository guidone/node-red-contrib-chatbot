const _ = require('underscore');
const lngDetector = new (require('languagedetect'));
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotLanguage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.language = config.language;
    this.mode = config.mode;

    this.on('input', function(msg) {

      var language = node.language;
      var mode = node.mode;

      // exit if not string
      if (_.isString(msg.payload.content)) {
        // if it's a command, then don't care about the language
        if (msg.payload.content.match(/^\/[A-Za-z0-9]*$/)) {
          node.send([msg, null]);
          return;
        }
        // if it's shorter than 5 chars, make it through, it's hard to tell the language
        if (msg.payload.content.length <= 5) {
          node.send([msg, null]);
          return;
        }
        // match the language
        var matchLanguage = lngDetector.detect(msg.payload.content, 10);
        // find position
        var position = -1;
        _(matchLanguage).each(function(duet, idx) {
          if (duet[0] === language) {
            position = idx;
          }
        });
        // set the trigger level
        var trigger = 0;
        switch(mode) {
          case 'strict':
            trigger = 0;
            break;
          case 'medium':
            trigger = 2;
            break;
          case 'loose':
            trigger = 5;
            break;
        }

        if (position !== -1 && position <= trigger) {
          node.send([msg, null]);
          return;
        }

      }

      node.send([null, msg]);
    });
  }
  registerType('chatbot-language', ChatBotLanguage);

};
