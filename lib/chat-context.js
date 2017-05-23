var _ = require('underscore');

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
    remove: function(key) {
      // eslint-disable-next-line no-undefined
      if (_chat[key] !== undefined) {
        // eslint-disable-next-line prefer-reflect
        delete _chat[key];
      }
      return this;
    },
    set: function(key, value) {
      if (_.isString(key)) {
        _chat[key] = value;
      } else if (_.isObject(key)) {
        _(key).each(function(value, key) {
          _chat[key] = value;
        });
      }
      return this;
    },
    dump: function() {
      // eslint-disable-next-line no-console
      console.log(_chat);
    },
    all: function() {
      return _chat;
    },
    clear: function() {
      _context[chatId] = {};
    }
  };
};
