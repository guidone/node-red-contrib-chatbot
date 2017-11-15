var _ = require('underscore');
var _store = {};

function FileFactory(params) {

  this.getOrCreate = function(chatId, defaults) {
    var _this = this;
    return new Promise(function(resolve, reject) {
      var chatContext = _this.get(chatId);
      if (chatContext == null) {
        resolve(_store[chatId] = new FileStore(defaults));
      }
      resolve(chatContext);
    });
  };
  this.get = function(chatId) {
    return _store[chatId];
  };

  return this;
}

_.extend(FileFactory.prototype, {
  name: 'Plain File',
  description: 'Simple file context provider.',
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

function FileStore(defaults) {
  console.log('Initialize FileStore with ', defaults);
  this._context = _.clone(defaults);
  return this;
}
_.extend(FileStore.prototype, {
  get: function(key) {
    var _this = this;
    return new Promise(function(resolve, reject) {
      resolve(_this._context[key]);
    });
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
    var _this = this;
    if (_.isString(key)) {
      _this._context[key] = value;
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
    return this._context;
  },
  clear: function() {
    this._context = {};
  }
});

module.exports = FileFactory;

