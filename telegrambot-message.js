var _ = require('underscore');


module.exports = function(RED) {


  function TelegramSendMessage(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.message = config.message;

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

    var handler = function(msg) {
      //msg._event = n.event;
      //node.receive(msg);

      console.log('passo da qua dovrei relayare');

      node.send([null, msg]);

    };
    RED.events.on('node:' + config.id, handler);


    this.on('input', function(msg) {
      var message = node.message;
      var tokens = message.match(/\{\{([A-Za-z0-9\-]*?)\}\}/g);
      var chatId = msg.payload.chatId;
      var messageId = msg.payload.messageId;

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

      msg.payload = {
        type: 'message',
        content: message,
        chatId: chatId,
        messageId: messageId
      };

      node.send([msg, null]);
    });

    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });
  }
  RED.nodes.registerType('telegrambot-message', TelegramSendMessage);

};
