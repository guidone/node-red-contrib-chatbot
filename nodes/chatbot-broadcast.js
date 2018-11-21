var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var MessageTemplate = require('../lib/message-template-async');
var emoji = require('node-emoji');
var ChatExpress = require('../lib/chat-platform/chat-platform');

module.exports = function(RED) {

  function ChatBotBroadcast(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var global = this.context().global;
    var environment = global.environment === 'production' ? 'production' : 'development';

    this.command = config.command;
    this.broadcastId = config.broadcastId;
    this.messageId = config.messageId;

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

      console.log('---broadcastId', broadcastId);

      /*var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);
      var transport = utils.getTransport(msg);*/

      switch(command) {
        case 'metrics':

          node.chat.broadcastMetrics(broadcastId)
            .then(
              function(metrics) {
                console.log('metrics', metrics);
                msg.payload = metrics;
                node.send(msg);
              },
              function(error) {
                console.log('Errrrrr', error);

              }
            );


          break;


        case 'store':

          node.chat.broadcastStoreMessage()
            .then(
              function(messageId) {
                console.log('messageId', messageId);
                // pass thru a broadcast message
                msg.payload = {
                  type: 'broadcast',
                  messageId: messageId
                };
                node.send(msg);
              },
              function(error) {
                // todo handle error
                console.log('Errrrrr', error);
              }
            );

          break;


      }


    });
  }

  RED.nodes.registerType('chatbot-broadcast', ChatBotBroadcast);
};
