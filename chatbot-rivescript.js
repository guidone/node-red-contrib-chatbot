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

    this.on('input', function(msg) {
      var script = node.script;
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var context = node.context();
      var chatContext = context.global.get('chat:' + chatId);

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
        bot = new RiveScript({utf8: true, debug: false});
        bot.stream(script);
        bot.sortReplies();
        context.set('rivebot', bot);
      }

      if (chatContext != null) {
        // anything that is not string printable
        bot.setUservars(chatId, _(chatContext.all()).mapObject(function(value) {
          return _.isString(value) || _.isNumber(value) || _.isArray(value) ? value : null;
        }));
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
