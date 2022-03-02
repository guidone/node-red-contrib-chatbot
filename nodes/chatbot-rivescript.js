const _ = require('underscore');
const RiveScript = require('rivescript');

const lcd = require('../lib/helpers/lcd');
const helpers = require('../lib/helpers/regexps');
const { when, getChatId, extractValue } = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

const getOrCreateBot = ({ script, scriptFile, context, debug }) => {
  return new Promise((resolve, reject) => {
    if (context.get('rivebot') != null) {
      resolve(context.get('rivebot'));
    } else if (!_.isEmpty(script)) {
      // create the new bot instance
      let bot = new RiveScript({
        utf8: true,
        debug: debug,
        onDebug: !debug ? null : str => {
          // eslint-disable-next-line no-console
          console.log(lcd.green('[RIVESCRIPT] ') + lcd.grey(str));
        }
      });
      bot.stream(script);
      bot.sortReplies();
      // store in context
      context.set('rivebot', bot);
      resolve(bot);
    } else if (!_.isEmpty(scriptFile)) {
      let bot = new RiveScript({
        utf8: true,
        debug: debug,
        onDebug: !debug ? null : str => {
          // eslint-disable-next-line no-console
          console.log(lcd.green('[RIVESCRIPT] ') + lcd.grey(str));
        }
      });
      bot.loadFile(scriptFile)
        .then(() => {
          bot.sortReplies();
          // store in context
          context.set('rivebot', bot);
          resolve(bot);
        })
        .catch(reject);
    }
  });
};

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotRivescript(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    globalContextHelper.init(this.context().global);
    this.script = config.script;
    this.debug = config.debug;
    this.scriptFile = config.scriptFile;
    this.parse_mode = config.parse_mode;
    this.transports = ['telegram', 'slack', 'facebook', 'smooch'];

    this.on('close', done => {
      const context = node.context();
      // clear the instance of rivebot
      context.set('rivebot', null);
      node.status({});
      done();
    });

    this.on('input', msg => {
      const chatId = getChatId(msg);
      const context = node.context();
      const chatContext = msg.chat();

      // exit if payload content is not string
      const content = extractValue('string', 'content', node, msg, false);
      const script = extractValue('string', 'script', node, msg, false);
      const scriptFile = extractValue('string', 'scriptFile', node, msg, false);
      const debug = extractValue('boolean', 'debug', node, msg, false);

      // skip if command
      if (_.isEmpty(content) || helpers.isCommand(content)) {
        node.send([null, msg]);
        return;
      }

      // create and cache the rivescript bot for this node, on deploy it will be reloaded
      getOrCreateBot({ script, scriptFile, context, debug })
        .then(bot => {
          // rivescript bot initialized
          when(chatContext != null ? chatContext.all() : {})
            .then(variables => {
              // anything that is not string printable
              const printableVariables = _(variables).mapObject(value => {
                return _.isString(value) || _.isNumber(value) || _.isArray(value) ? value : null;
              });
              bot.setUservars(chatId, printableVariables);
              // set topic if any
              if (!_.isEmpty(variables.topic)) {
                bot.setUservar(chatId, 'topic', variables.topic);
              } else {
                bot.setUservar(chatId, 'topic', 'random');
              }
              // get a reply
              return bot.reply(chatId, content);
            })
            .then(reply => {
              if (reply.match(/^ERR:/)) {
                // pass thru
                return Promise.reject(false);
              }
              // set the vars back
              return Promise.all([reply, bot.getUservars(chatId)]);
            })
            .then(([reply, replyVars]) => {
              const variablesToPutBack = _(replyVars).omit('topic', '__initialmatch__', '__history__', '__lastmatch__', '__last_triggers__');
              // set back the intent (topic in RiveScript)
              if (!_.isEmpty(replyVars.topic) && replyVars.topic !== 'random') {
                variablesToPutBack.topic = replyVars.topic;
              }
              // set back
              return Promise.all([reply, when(chatContext.set(variablesToPutBack))]);
            })
            .then(([reply]) => {
              // payload
              msg.payload = reply;
              // send out reply
              node.send([msg, null]);
            })
            .catch(error => {
              if (error instanceof Error) {
                lcd.dump(error, 'Runtime error in Rivescript');
              } else {
                // pass thru
                node.send([null, msg]);
              }
            });
        })
        .catch(error => {
          lcd.dump(error, 'Error creating Rivescript bot');
        })
    });
  }

  registerType('chatbot-rivescript', ChatBotRivescript);
};
