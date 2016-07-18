var _ = require('underscore');
var ChatContext = require('./lib/chat-context.js');
var moment = require('moment');
var MessageTemplate = require('./lib/message-template.js');

module.exports = function(RED) {

  function ChatBotMessage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.message = config.message;
    this.answer = config.answer;
    this.track = config.track;
    this.transports = ['telegram', 'slack'];

    // relay message
    var handler = function(msg) {
      node.send([null, msg]);
    };
    RED.events.on('node:' + config.id, handler);
    
    this.on('input', function(msg) {
      var message = node.message;
      var track = node.track;
      var answer = node.answer;
      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var messageId = msg.payload.messageId || (originalMessage && originalMessage.message_id);
      var chatContext = context.flow.get('chat:' + chatId) || ChatContext(chatId);
      var template = MessageTemplate(msg, node);

      // check transport compatibility
      if (!_.contains(node.transports, msg.originalMessage.transport)) {
        node.error('This node is not available for transport: ' + msg.originalMessage.transport);
        return;
      }

      if (!_.isEmpty(node.message)) {
        message = node.message;
      } else if (_.isString(msg.payload) && !_.isEmpty(msg.payload)) {
        message = msg.payload;
      } else {
        node.error('Empty message');
      }

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (!_.isEmpty(node.wires[1])) {
        chatContext.set('currentConversationNode', node.id);
        chatContext.set('currentConversationNode_at', moment());
      }
      // payload
      msg.payload = {
        type: 'message',
        content: template(message),
        chatId: chatId,
        messageId: messageId,
        inbound: false
      };
      // reply flag
      if (answer) {
        msg.payload.options = {
          reply_to_message_id: messageId
        };
      }
      // send out reply
      node.send(track ? [msg, null] : msg);
    });

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });
  }

  RED.nodes.registerType('chatbot-message', ChatBotMessage);
};
