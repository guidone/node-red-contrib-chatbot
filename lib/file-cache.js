var _ = require('underscore');
var moment = require('moment');
var fs = require('fs');

module.exports = function(options) {

  options = _.extend({
    expiresIn: 1,
    removeAfterUse: false,
    debug: true
  }, options);

  var _store = {};

  var self = {

    store: function(id, buffer, opts) {
      opts = _.extend({ contentType: null, removeAfterUse: false }, opts);
      _store[id] = {
        buffer: buffer,
        expiresAt: moment().add(options.expiresIn, 'minutes'),
        removeAfterUse: opts.removeAfterUse
      };
      if (opts.contentType != null) {
        _store[id].contentType = opts.contentType;
      }
      return self;
    },

    exists: function(id) {
      return _store[id] != null;
    },

    get: function(id, opts) {
      console.trace('get')
      opts = _.extend({ remove: false }, opts);
      if (_store[id]) {
        if (options.debug) {

          console.log('[FILECACHE] Cache hit id: ', id);
        }
        var buffer = _.clone(_store[id]);
        if (opts.remove || _store[id].removeAfterUse) {
          self.remove(id);
        }
        return buffer;
      }
      if (options.debug) {
        console.log('[FILECACHE] Cache miss id: ', id);
      }
      return null;
    },

    remove: function(id) {
      if (options.debug) {
        console.log('[FILECACHE] removed file id: ', id);
      }
      delete _store[id];
      return self;
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
      console.log('Files in cache: ', _.keys(_store).length);
    },

    /**
     * @method cleanup
     * Purge all expired files
     * @chainable
     */
    cleanup: function() {
      var now = moment();
      var ids = _(_store).keys();
      _(ids).each(function(id) {
        if (now.isAfter(_store[id].expiresAt)) {
          self.remove(id);
        }
      });
      return self;
    }

  };

  return self;
};
