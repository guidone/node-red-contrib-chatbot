/* eslint-disable */
var _ = require('underscore');

module.exports = function(response) {
  return {
    apiAi: {
      textRequest: function(message, options) {
        var _events = {};
        var obj = {
          on: function(eventName, callback) {
            _events[eventName] = callback;
            return obj;
          },
          end: function() {
            if (response.result != null) {
              if (_.isFunction(_events['response'])) {
                _events['response'](response);
              }
            } else {
              if (_.isFunction(_events['error'])) {
                _events['error'](response);
              }
            }
            return obj;
          }
        };
        return obj;
      } // end textRequest
    } // end ApiAi
  }; // first factory
};
/* eslint-enable */
