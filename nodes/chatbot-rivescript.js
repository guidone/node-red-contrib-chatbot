var _ = require('underscore');
var RiveScript = require('rivescript');
var helpers = require('../lib/helpers/regexps');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotRivescript(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.script = config.script;
    this.debug = config.debug;
    this.answer = config.answer;
    this.parse_mode = config.parse_mode;
    this.transports = ['telegram', 'slack', 'facebook', 'smooch'];

    this.on('close', function (done) {
      var context = node.context();
      // clear the instance of rivebot
      context.set('rivebot', null);
      node.status({});
      done();
    });

    this.on('input', function(msg) {
      var script = node.script;
      var debug = _.isBoolean(node.debug) ? node.debug : false;
      var chatId = utils.getChatId(msg);
      var context = node.context();
      var chatContext = msg.chat();

      // exit if payload content is not string
      var content = null;
      if (msg.payload != null && msg.payload.content != null && _.isString(msg.payload.content)) {
        content = msg.payload.content;
      }
      if (_.isEmpty(content) || helpers.isCommand(content)) {
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
          debug: debug,
          onDebug: debug && function(str) {
            node.warn(str);
          }
        });
        bot.stream(script);
        bot.sortReplies();
        // store in context
        context.set('rivebot', bot);
      }

      // set the topic
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
        var cloned = RED.util.cloneMessage(msg);
        cloned.payload = reply;
        node.send([null, cloned]);
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
