var _ = require('underscore');
var ChatContext = require('./lib/chat-context.js');
var moment = require('moment');

module.exports = function(RED) {

  function ChatBotAsk(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.answers = config.answers;

    // relay message
    var handler = function(msg) {
      node.send([null, msg]);
    };
    RED.events.on('node:' + config.id, handler);

    this.on('input', function(msg) {

      var context = node.context();
      var chatId = msg.payload.chatId;
      var messageId = msg.payload.messageId;
      var answers = node.answers;
      var chatContext = context.flow.get('chat:' + chatId) || ChatContext(chatId);
      
      // prepare array for answers
      var messageAnswers = _(answers).map(function(answer) {
        return [answer];
      });

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (!_.isEmpty(node.wires[1])) {
        chatContext.set('currentConversationNode', node.id);
        chatContext.set('currentConversationNode_at', moment());
      }

      // send out the message
      msg.payload = {
        type: 'message',
        content: 'Pick your choice',
        chatId: chatId,
        messageId: messageId,
        options: {
          reply_markup: JSON.stringify({
            keyboard: messageAnswers,
            'resize_keyboard': true,
            'one_time_keyboard': true
          })
        }
      };

      node.send([msg, null]);
    });

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });
  }

  RED.nodes.registerType('chatbot-ask', ChatBotAsk);

};
