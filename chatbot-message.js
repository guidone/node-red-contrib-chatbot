var _ = require('underscore');

module.exports = function(RED) {

  function ChatBotMessage(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.message = config.message;
    this.answer = config.answer;

    var getTokenValue = function(token) {
      var value = null;
      var context = node.context();
      if (!_.isEmpty(context.get(token))) {
        value = context.get(token);
      } else if (!_.isEmpty(context.flow.get(token))) {
        value = context.flow.get(token);
      } else if (!_.isEmpty(context.global.get(token))) {
        value = context.global.get(token);
      }
      return value;
    };

    // relay message
    var handler = function(msg) {
      node.send([null, msg]);
    };
    RED.events.on('node:' + config.id, handler);


    this.on('input', function(msg) {
      var message = node.message;
      var context = node.context();
      var tokens = message.match(/\{\{([A-Za-z0-9\-]*?)\}\}/g);
      var chatId = msg.payload.chatId;
      var messageId = msg.payload.messageId;
      var answer = node.answer;

      if (tokens != null && tokens.length !== 0) {
        tokens = _(tokens).map(function(token) {
          return token.replace('{{', '').replace('}}', '');
        });
        // replace all tokens
        _(tokens).each(function(token) {
          var value = getTokenValue(token);
          // todo make regexp
          message = message.replace('{{' + token + '}}', value);
        });

      }
      // check if this node has some wirings in the follow up pin, in that case
      // the next message should be redirected here
      if (!_.isEmpty(node.wires[1])) {
        context.flow.set('currentConversationNode', node.id);
      }
      // send out the message
      msg.payload = {
        type: 'message',
        content: message,
        chatId: chatId,
        messageId: messageId
      };
      // reply flag
      if (answer) {
        msg.payload.options = {
          reply_to_message_id: messageId
        };
      }

      node.send([msg, null]);
    });

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });
  }

  RED.nodes.registerType('chatbot-message', ChatBotMessage);

};
