var ChatContext = require('./chat-context');

var _store = {};

module.exports = {

  set: function(chatId, context) {
    _store[chatId] = context;
    return this;
  },

  get: function(chatId) {
    return _store[chatId];
  },

  createChatContext: function(node, chatId) {
    var store = _store;
    var chatContext = ChatContext(chatId);
    store[chatId] = chatContext;
    return chatContext;
  },

  getOrCreateChatContext: function(node, chatId, defaults) {
    var store = _store;
    var chatContext = store[chatId];
    if (chatContext == null) {
      chatContext = this.createChatContext(node, chatId);
      chatContext.set(defaults);
    }
    return chatContext;
  },

  getChatContext: function(node, chatId) {
    var store = _store;
    return store[chatId] != null ? store[chatId] : null;
  }

};
