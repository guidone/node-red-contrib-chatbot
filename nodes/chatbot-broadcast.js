var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var MessageTemplate = require('../lib/message-template-async');
var emoji = require('node-emoji');
var ChatExpress = require('../lib/chat-platform/chat-platform');

module.exports = function(RED) {

  function ChatBotBroadcast(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.command = config.command;
    this.answer = config.answer;
    this.broadcastId = config.broadcastId;

    //this.transports = ['telegram', 'slack', 'facebook', 'smooch', 'viber', 'twilio'];

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

      console.log('node chat', node.chat);


      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var template = MessageTemplate(msg, node);
      var transport = utils.getTransport(msg);


      node.send(msg)

    });
  }

  RED.nodes.registerType('chatbot-broadcast', ChatBotBroadcast);
};
