module.exports = function(chatId) {
  
  var _context = {
    chatId: chatId
  };

  return {
    get: function(key) {
      return _context[key];
    },
    set: function(key, value) {
      _context[key] = value;
      return this;
    },
    dump: function() {
      console.log(_context);
    }

  };

};
