var _ = require('underscore');

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


      // prepare array for answers
      var messageAnswers = _(answers).map(function(answer) {
        return [answer];
      });

      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (!_.isEmpty(node.wires[1])) {
        context.flow.set('currentConversationNode', node.id);
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
