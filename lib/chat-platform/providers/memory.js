var _ = require('underscore');
var _store = {};

function MemoryStore(defaults) {
  this._context = _.clone(defaults || {});
  return this;
}
_.extend(MemoryStore.prototype, {
  get: function(key) {
    var _this = this;
    var keys = Array.prototype.slice.call(arguments, 0);
    if (keys.length === 1) {
      return this._context[key] != null ? this._context[key] : null;
    }
    var result = {};
    _(keys).each(function (key) {
      result[key] = _this._context[key];
    });
    return result;
  },
  remove: function() {
    var _this = this;
    var keys = _.clone(arguments);
    _(keys).each(function(key) {
      // eslint-disable-next-line prefer-reflect
      delete _this._context[key];
    });
    return this;
  },
  set: function(key, value) {
    var _this = this;
    if (_.isString(key)) {
      this._context[key] = value;
    } else if (_.isObject(key)) {
      _(key).each(function(value, key) {
        _this._context[key] = value;
      });
    }
    return this;
  },
  dump: function() {
    // eslint-disable-next-line no-console
    console.log(this._context);
  },
  all: function() {
    return this._context != null ? this._context : {};
  },
  clear: function() {
    this._context = {};
    return this;
  }
});

function MemoryFactory() {

  this.getOrCreate = function(chatId, defaults) {
    var chatContext = this.get(chatId);
    if (chatContext == null) {
      _store[chatId] = new MemoryStore(defaults);
      return _store[chatId];
    }
    return chatContext;
  };
  this.get = function(chatId) {
    return _store[chatId];
  };

  return this;
}
_.extend(MemoryFactory.prototype, {
  name: 'Memory',
  description: 'Memory context provider, it\' fast and synchronous but it doesn\'t persists the values, once the'
    + ' server is restarted all contexts are lost. It doesn\'t requires any parameters. Good for testing.',
  get: function(/*chatId*/) {
  },
  getOrCreate: function(/*chatId, defaults*/) {
  },
  stop: function() {
    return new Promise(function(resolve) {
      resolve();
    });
  },
  start: function() {
    return new Promise(function(resolve) {
      resolve();
    });
  }
});


module.exports = MemoryFactory;

