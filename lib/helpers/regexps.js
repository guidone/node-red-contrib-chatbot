var _ = require('underscore');

module.exports = {

  email: function(token) {
    var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
    var matched = token.match(re);
    return matched != null ? matched[0] : null;
  },

  number: function(token) {
    var re = /([0-9]+)/;
    var matched = token.match(re);
    return matched != null ? matched[0] : null;
  },

  url: function(token) {
    var re = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    var matched = token.match(re);
    return matched != null ? matched[0] : null;
  },

  isCommand: function(msg) {
    return _.isString(msg) && msg.match(/^\/.*/) != null;
  }

};
