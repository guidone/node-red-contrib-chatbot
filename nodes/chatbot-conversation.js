const _ = require('underscore');

const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');
const GetEnvironment = require('../lib/helpers/get-environment');
const GetNode = require('../lib/helpers/get-node');
const Evaluate = require('../lib/evaluate');

const isEmpty = value => _.isEmpty(value) && !_.isNumber(value);

const {
  extractValue
} = require('../lib/helpers/utils');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);
  const getEnvironment = GetEnvironment(RED);
  const getNode = GetNode(RED);

  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    globalContextHelper.init(this.context().global);

    const node = this;

    this.chatId = config.chatId;
    this.userId = config.userId;
    this.transport = config.transport;
    this.store = config.store;
    this.botProduction = config.botProduction;
    this.botDevelopment = config.botDevelopment;

    this.on('input', async function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const evaluate = Evaluate(msg);
      // get config
      let chatId = evaluate(extractValue('stringOrNumber', 'chatId', node, msg, false));
      let userId = evaluate(extractValue('stringOrNumber', 'userId', node, msg, false));

      // get from config, but check also params
      let botNode = getEnvironment() === 'production' ? node.botProduction : node.botDevelopment;
      if (msg != null && _.isString(msg.botNode) && !_.isEmpty(msg.botNode)) {
        botNode = msg.botNode;
      } else if (msg != null && msg.payload != null && _.isString(msg.payload.botNode) && !_.isEmpty(msg.payload.botNode)) {
        botNode = msg.payload.botNode;
      }

      // check userId or chatId
      if (isEmpty(chatId) && isEmpty(userId)) {
        done('Both userId and chatId empty, cannot start a conversation');
        return;
      }
      // check bot node
      let platformNode;
      const nodeInstance = getNode(botNode);
      if (nodeInstance != null) {
        platformNode = nodeInstance.chat;
      } else {
        done('chatId was correctly specified but without a valid chatbot configuration');
        return;
      }

      // finally create the message
      try {
        const message = await platformNode.createMessage(
          !_.isEmpty(chatId) ? chatId : null,
          !_.isEmpty(userId) ? userId : null,
          null,
          msg
        );
        message.redBot = {
          environment: getEnvironment()
        };
        send({ ...msg, ...message });
        done();

        return;
      } catch(e) {
        done(e);
      }
    });
  }

  registerType('chatbot-conversation', ChatBotConversation);
};
