var _ = require('underscore');
var _store = {};
var fs = require('fs');

function FileFactory(params) {

  params = params || {};
  if (_.isEmpty(params.path)) {
    throw 'Plain file context provider: missing parameter "path"';
  }
  if (!fs.existsSync(params.path)) {
    throw 'Plain file context provider: "path" (' + params.path + ') doesn\'t exist';
  }

  this.getOrCreate = function(chatId, defaults) {
    var _this = this;
    return new Promise(function(resolve, reject) {
      var chatContext = _this.get(chatId);
      if (chatContext != null) {
        resolve(chatContext);
      } else {
        var filePath = params.path + '/' + chatId + '.json';
        fs.exists(filePath, function(exists) {
          if (exists) {
            _store[chatId] = new FileStore(null, filePath);
            _store[chatId].load()
              .then(function() {
                return _store[chatId].set(defaults);
              })
              .then(
                function() {
                  resolve(_store[chatId]);
                },
                reject
              );
            // end context file exist
          } else {
            _store[chatId] = new FileStore(defaults, filePath);
            _store[chatId].save()
              .then(
                function() {
                  resolve(_store[chatId]);
                },
                reject
              );
          } // end context file doesn't exist
        });
      } // else chat context not in memory
    }); // end promise
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
  start: function() {
    return new Promise(function(resolve) {
      resolve();
    });
  },
  stop: function() {
    return new Promise(function(resolve) {
      resolve();
    });
  }
});

function FileStore(defaults, file) {
  this._context = _.clone(defaults || {});
  this._file = file;
  return this;
}
_.extend(FileStore.prototype, {
  get: function(key) {
    var _this = this;
    return new Promise(function(resolve, reject) {
      _this.load()
        .then(
          function() {
            resolve(_this._context[key]);
          },
          reject
        );
    });
  },
  load: function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      fs.readFile(_this._file, function(err, content) {
        if (err != null) {
          reject(err);
        } else {
          try {
            _this._context = JSON.parse(content);
            resolve();
          } catch(e) {
            reject(e);
          }
        }
      });
    });
  },
  save: function() {
    var _this = this;
    return new Promise(function(resolve, reject) {
      fs.writeFile(_this._file, JSON.stringify(_this._context), function(err) {
        if (err != null) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  remove: function(key) {
    // eslint-disable-next-line no-undefined
    if (this._context[key] !== undefined) {
      // eslint-disable-next-line prefer-reflect
      delete this._context[key];
    }
    return _this.save();
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
    return _this.save();
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

