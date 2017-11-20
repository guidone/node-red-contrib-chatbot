var _ = require('underscore');
var ChatContextStore = require('../lib/chat-context-store');
var ContextProviders = require('../lib/chat-platform/chat-context-factory');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  var contextProviders = ContextProviders(RED);

  function ChatBotConversation(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    this.chatId = config.chatId;
    this.transport = config.transport;
    this.contextMessageId = config.contextMessageId;
    this.messageId = config.messageId;
    this.store = config.store;



    this.on('input', function(msg) {
      // evaluate chat id

      var task = new Promise(function(resolve) { resolve(); });


      /*if (!_.isEmpty(node.chatId)) {
        chatId = node.chatId;
      } else if (msg.payload != null && msg.payload.chatId != null) {
        chatId = msg.payload.chatId;
      }*/
      var chatId = utils.extractValue('string', 'chatId', node, msg);
      var transport = utils.extractValue('string', 'transport', node, msg);
      var messageId = utils.extractValue('string', 'messageId', node, msg);

      /*if (!_.isEmpty(node.messageId)) {
        messageId = node.messageId;
      } else if (msg.payload != null && msg.payload.messageId != null) {
        messageId = msg.payload.messageId;
      }*/
      /*if (!_.isEmpty(node.transport)) {
        transport = node.transport;
      } else if (msg.payload != null && msg.payload.transport != null) {
        transport = msg.payload.transport;
      }*/
      // get the chat context

      if (transport === 'slack') {
        var store = RED.nodes.getNode(node.store);
        var contextProvider = contextProviders.getProvider(
          store.contextStorage,
          store.contextParams
        );
        task = task.then(function() {
          return contextProvider.getOrCreate(chatId, {
            chatId: chatId,
            transport: transport,
            authorized: false
          });
        });
      } else {
        task = task.then(function() {
          return ChatContextStore.getOrCreateChatContext(node, chatId, {
            chatId: chatId,
            transport: transport,
            authorized: false
          });
        });
      }

      var debug = utils.extractValue('boolean', 'showdebug', node, msg);



      /*else if (this.contextMessageId && chatContext.get('messageId') != null) {
        messageId = chatContext.get('messageId');
      }*/

      task.then(function(chatContext) {
        // ensure the original message is injected
        msg.originalMessage = {
          chat: {
            id: chatId
          },
          message_id: null,
          modify_message_id: messageId,
          transport: transport
        };
        msg.chat = function() {
          return chatContext;
        };

        /*if (transport === 'slack') {
          msg.chat = function() {
            console.log('chiedo internamente');
            return chatContext = contextProvider.get(chatId);
          }
        } else {
          msg.chat = function () {
            return ChatContextStore.getOrCreateChatContext(node, chatId, {
              chatId: chatId,
              transport: transport,
              authorized: false
            });
          };
        }*/

        // fix chat id in payload if any
        if (_.isObject(msg.payload) && msg.payload.chatId != null) {
          msg.payload.chatId = chatId;
        }

        node.send(msg);
      });


    });

  }

  RED.nodes.registerType('chatbot-conversation', ChatBotConversation);
};
