var _ = require('underscore');
var moment = require('moment');
var fs = require('fs');
var os = require('os');
var utils = require('./helpers/utils');
var when = utils.when;

module.exports = function(options) {

  options = _.extend({
    expiresIn: 1,
    removeAfterUse: false,
    debug: false
  }, options);

  var _store = {};

  var self = {

    store: function(id, buffer, opts) {
      opts = _.extend({ contentType: null, removeAfterUse: false }, opts);
      var tmpFile = os.tmpdir() + '/cache_' + id;
      if (options.debug) {
        // eslint-disable-next-line no-console
        console.log('[FILECACHE] store: ', tmpFile);
      }

      return new Promise(function(resolve, reject) {
        fs.writeFile(tmpFile, buffer, function(err) {
          if (err) {
            reject(err);
          }
          _store[id] = {
            expiresAt: moment().add(options.expiresIn, 'minutes'),
            removeAfterUse: opts.removeAfterUse
          };
          if (opts.contentType != null) {
            _store[id].contentType = opts.contentType;
          }
          resolve();
        });
      });
    },

    exists: function(id) {
      return _store[id] != null;
    },

    get: function(id, opts) {
      opts = _.extend({ remove: false }, opts);
      var tmpFile = os.tmpdir() + '/cache_' + id;

      return new Promise(function(resolve, reject) {
        if (_store[id]) {
          // element found
          if (options.debug) {
            // eslint-disable-next-line no-console
            console.log('[FILECACHE] Cache hit id: ', tmpFile);
          }
          fs.readFile(tmpFile, function(error, buffer) {
            if (error) {
              reject(error)
            } else {
              // start with some cleaning
              var task = self.sweep();
              // get the whole record, clone and add the bufer
              var result = _.clone(_store[id]);
              result.buffer = buffer;
              // if needs to be removed, then remove it, otherwise resolve immediately
              if (opts.remove || _store[id].removeAfterUse) {
                task = task.then(function() {
                  // don't want to stop if unable to remove file
                  return self.remove(id, { silent: true });
                });
              }
              // finally
              task.then(
                function() {
                  resolve(result)
                },
                function(error) {
                  reject(error);
                });
            }
          });
        } else {
          // element not found
          if (options.debug) {
            // eslint-disable-next-line no-console
            console.log('[FILECACHE] Cache miss id: ', tmpFile);
          }
        }
      });
    },

    remove: function(id, opts) {
      opts = _.extend({ silent: false}, opts);
      var tmpFile = os.tmpdir() + '/cache_' + id;
      if (options.debug) {
        // eslint-disable-next-line no-console
        console.log('[FILECACHE] removed file: ', tmpFile);
      }

      return new Promise(function(resolve, reject) {
        fs.unlink(tmpFile, function(err) {
          if (err && !opts.silent) {
            reject(err);
          } else if (err && opts.silent) {
            // sometimes I don't want to break even if there's a filesystyem error
            resolve();
          } else {
            delete _store[id];
            resolve();
          }
        });
      });
    },

    /**
     * @method destroy
     * Destroy the cache
     * @chainable
     */
    destroy: function() {
      _store = null;
      return self;
    },

    stats: function() {
      // eslint-disable-next-line no-console
      console.log('Files in cache: ', _.keys(_store).length);
    },

    sweep: function() {
      var task = when(true);

      if (options.debug) {
        // eslint-disable-next-line no-console
        console.log('[FILECACHE] sweeping');
      }

      var now = moment();
      var ids = _(_store).keys();
      _(ids).each(function(id) {
        if (now.isAfter(_store[id].expiresAt)) {
          task.then(function() {
            // do not break if not able to remove the file
            return self.remove(id, { silent: true });
          });
        }
      });
      return task;
    },

    count: function() {
      return _(_store).keys().length;
    }

  };

  return self;
};
