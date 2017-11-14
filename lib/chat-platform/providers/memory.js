var _ = require('underscore');
var _store = {};

function MemoryFactory(params) {

  this.getOrCreate = function(chatId, defaults) {
    var chatContext = this.get(chatId);
    if (chatContext == null) {
      return _store[chatId] = new MemoryStore(defaults);
    }
    return chatContext;
  };
  this.get = function(chatId) {
    return _store[chatId];
  };

  return this;
}

_.extend(MemoryFactory.prototype, {
  get: function(chatId) {
  },
  getOrCreate: function(chatId, defaults) {
  },
  close: function() {
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

function MemoryStore(defaults) {
  console.log('Initialize MemoryStore with ', defaults);
  this._context = _.clone(defaults);
  return this;
}
_.extend(MemoryStore.prototype, {
  get: function(key) {
    return this._context[key];
  },
  remove: function(key) {
    // eslint-disable-next-line no-undefined
    if (this._context[key] !== undefined) {
      // eslint-disable-next-line prefer-reflect
      delete this._context[key];
    }
    return this;
  },
  set: function(key, value) {
    if (_.isString(key)) {
      this._context[key] = value;
    } else if (_.isObject(key)) {
      _(key).each(function(value, key) {
        this._context[key] = value;
      });
    }
    return this;
  },
  dump: function() {
    // eslint-disable-next-line no-console
    console.log(this._context);
  },
  all: function() {
    return this._context;
  },
  clear: function() {
    this._context = {};
  }
});

module.exports = MemoryFactory;

