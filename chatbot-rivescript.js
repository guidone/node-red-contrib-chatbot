var _ = require('underscore');
var RiveScript = require('rivescript');

module.exports = function(RED) {

  function ChatBotRivescript(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.script = config.script;
    this.answer = config.answer;
    this.parse_mode = config.parse_mode;
    this.transports = ['telegram', 'slack', 'facebook'];

    this.on('close', function (done) {
      var context = node.context();
      // clear the instance of rivebot
      context.set('rivebot', null);
      node.status({});
      done();
    });

    this.on('input', function(msg) {
      var script = node.script;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var context = node.context();
      var chatContext = msg.chat();

      // exit if payload content is not string
      var content = null;
      if (msg.payload != null && msg.payload.content != null && _.isString(msg.payload.content)) {
        content = msg.payload.content;
      }
      if (_.isEmpty(content)) {
        return;
      }

      // create and cache the rivescript bot for this node, on deploy it will be reloaded
      var bot = null;
      if (context.get('rivebot') != null) {
        bot = context.get('rivebot');
      } else {
        // create the new bot instance
        bot = new RiveScript({
          utf8: true,
          debug: false,
          onDebug: function(str) {
            // log parsing error to node-red and set status
            node.error(str);
            node.status({fill: 'red', shape: 'ring', text: 'parsing errors'});
          }
        });
        bot.stream(script);
        bot.sortReplies();
        // store in context
        context.set('rivebot', bot);
      }

      if (chatContext != null) {
        // anything that is not string printable
        bot.setUservars(chatId, _(chatContext.all()).mapObject(function(value) {
          return _.isString(value) || _.isNumber(value) || _.isArray(value) ? value : null;
        }));
        if (!_.isEmpty(chatContext.get('topic'))) {
          bot.setUservar(chatId, 'topic', chatContext.get('topic'));
        } else {
          bot.setUservar(chatId, 'topic', 'random');
        }
      }
      // get a reply
      var reply = bot.reply(chatId, content);
      if (reply.match(/^ERR:/)) {
        // clone the object, otherwise side effect
        msg = {
          originalMessage: originalMessage,
          payload: {content: reply}
        };
        node.send([null, msg]);
      } else {
        if (chatContext != null) {
          // set the vars back
          var replyVars = bot.getUservars(chatId);
          chatContext.set(_(replyVars).omit('topic', '__initialmatch__', '__history__', '__lastmatch__'));
          // set back the intent (topic in RiveScript)
          if (!_.isEmpty(replyVars.topic) && replyVars.topic != 'random') {
            chatContext.set('topic', replyVars.topic);
          }
        }
        // payload
        msg.payload = reply;
        // send out reply
        node.send([msg, null]);
      }
    });
  }

  RED.nodes.registerType('chatbot-rivescript', ChatBotRivescript);
};
