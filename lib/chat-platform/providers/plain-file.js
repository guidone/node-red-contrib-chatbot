var _ = require('underscore');
var _store = {};
var fs = require('fs');
var moment = require('moment');

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
  description: 'Simple file context provider: chat context will be stored in plain json files. Specify the storage path in'
    + ' params as JSON config like this <pre style="margin-top: 10px;">\n'
    + '{\n'
    + '"path": "/my-path/my-context-files"\n'
    +'}</pre>',
  get: function(/*chatId*/) {
  },
  getOrCreate: function(/*chatId, defaults*/) {
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
    var keys = Array.prototype.slice.call(arguments, 0);
    return new Promise(function(resolve, reject) {
      _this.load()
        .then(
          function() {
            if (keys.length === 1) {
              return resolve(_this._context[key]);
            }
            var result = {};
            _(keys).each(function (key) {
              result[key] = _this._context[key];
            });
            resolve(result);
          },
          reject
        );
    });
  },
  load: function() {
    var _this = this;
    var date = new RegExp('^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}\.[0-9]{1,3}Z$');
    return new Promise(function(resolve, reject) {
      fs.readFile(_this._file, function(err, content) {
        if (err != null) {
          reject(err);
        } else {
          try {
            _this._context = JSON.parse(content);
            // go through every key/value to search for a date-like string
            _(_this._context).each(function(value, key) {
              if (_.isString(value) && value.match(date)) {
                _this._context[key] = moment(value);
              }
            });
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
    var _this = this;
    // eslint-disable-next-line no-undefined
    return new Promise(function(resolve, reject) {
      _this.load()
        .then(function() {
          delete _this._context[key];
          return _this.save();
        })
        .then(resolve, reject);
    });
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
    return this.save();
  }
});

module.exports = FileFactory;

