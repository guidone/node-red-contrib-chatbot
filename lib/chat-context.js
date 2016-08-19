// global storage
var _context = {};

module.exports = function(chatId) {

  if (_context[chatId] == null) {
    _context[chatId] = {};
  }
  var _chat = _context[chatId];

  return {
    get: function(key) {
      return _chat[key];
    },
    set: function(key, value) {
      _chat[key] = value;
      return this;
    },
    dump: function() {
      console.log(_chat);
    },
    all: function() {
      return _chat;
    }
  };
};
