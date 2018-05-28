var _ = require('underscore');
var moment = require('moment');
var fs = require('fs');

module.exports = function(options) {

  options = _.extend({
    expiresIn: 1,
    removeAfterUse: true
  }, options);

  var _store = {};

  var self = {

    store: function(id, buffer, opts) {
      opts = _.extend({ contentType: null}, opts);
      _store[id] = {
        buffer: buffer,
        expiresAt: moment().add(options.expiresIn, 'minutes')
      };
      if (opts.contentType != null) {
        _store[id].contentType = opts.contentType;
      }
      return self;
    },

    get: function(id, opts) {

      opts = _.extend({ remove: false }, opts);
      if (_store[id]) {
        var buffer = _.clone(_store[id]);
        if (opts.remove) {
          self.remove(id);
        }
        return buffer;
      }
      return null;
    },

    remove: function(id) {
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
