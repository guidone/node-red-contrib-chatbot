const _ = require('underscore');

const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');
const GetEnvironment = require('../lib/helpers/get-environment');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);
  const getEnvironment = GetEnvironment(RED);

  function ChatBotBroadcast(config) {
    RED.nodes.createNode(this, config);
    globalContextHelper.init(this.context().global);

    var node = this;
    var environment = getEnvironment();

    this.command = config.command;
    this.broadcastId = config.broadcastId;
    this.messageId = config.messageId;
    this.messagingType = config.messagingType;
    this.notificationType = config.notificationType;
    this.sendAt = config.sendAt;

    this.bot = config.bot;
    this.botProduction = config.botProduction;
    this.config = RED.nodes.getNode(environment === 'production' ? this.botProduction : this.bot);

    this.config = RED.nodes.getNode(this.bot);
    if (this.config) {
      this.status({fill: 'red', shape: 'ring', text: 'disconnected'});
      node.chat = this.config.chat;
      if (node.chat) {
        this.status({fill: 'green', shape: 'ring', text: 'connected'});
      } else {
        node.warn('Missing or incomplete configuration in Facebook Receiver');
      }
    } else {
      node.warn('Missing configuration in Facebook Broadcast');
    }

    this.on('input', function(msg) {

      var command = utils.extractValue('string', 'command', node, msg, false);
      var broadcastId = utils.extractValue('string', 'broadcastId', node, msg, false);
      var messageId = utils.extractValue('string', 'messageId', node, msg, false);
      var messagingType = utils.extractValue('string', 'messagingType', node, msg, false);
      var notificationType = utils.extractValue('string', 'notificationType', node, msg, false);
      var sendAt = utils.extractValue('string', 'sendAt', node, msg, false);

      /*
      console.log('---broadcast');
      console.log('broadcastId', broadcastId);
      console.log('messageId', messageId);
      console.log('messagingType', messagingType);
      console.log('notificationType', notificationType);
      console.log('sendAt', sendAt);
      */

      switch(command) {
        // get metrics for a broadcasted message
        case 'metrics':
          node.chat
            .broadcastMetrics(broadcastId)
            .then(
              function(metrics) {
                msg.payload = metrics;
                node.send(msg);
              },
              node.error
            );
          break;
        // store a message
        case 'store':
          node.chat.broadcastStoreMessage(msg.payload)
            .then(
              function(messageId) {
                // pass thru a broadcast message
                msg.payload = {
                  type: 'broadcast',
                  messageId: messageId,
                  messagingType: !_.isEmpty(messagingType) ? messagingType : undefined,
                  notificationType: !_.isEmpty(notificationType) ? notificationType : undefined
                };
                node.send(msg);
              },
              node.error
            );
          break;
        // schedule a stored message
        case 'schedule':
          node.chat.broadcastSendMessage(
            messageId,
            {
              messagingType: !_.isEmpty(messagingType) ? messagingType : undefined,
              notificationType: !_.isEmpty(notificationType) ? notificationType : undefined,
              sendAt: sendAt
            })
            .then(
              function(broadcastId) {
                msg.payload = { broadcastId : broadcastId };
                node.send(msg);
                },
              node.error
            );
          break;
        // List all messages
        case 'list':
          node.chat.broadcastList()
            .then(
              function(list) {
                msg.payload = list;
                node.send(msg);
              },
              node.error
            );
          break;
        // Cancel a scheduled message
        case 'cancel':
          node.chat.broadcastCancel(broadcastId)
            .then(
              function() {
                node.send(msg);
              },
              node.error
            );
          break;
        // Get status of a message
        case 'status':
          node.chat.broadcastStatus(broadcastId)
            .then(
              function() {
                node.send(msg);
              },
              node.error
            );
          break;
      }

    });
  }

  registerType('chatbot-broadcast', ChatBotBroadcast);
};
