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

  /**
   * @method isCommand
   * Check if a string is a command, if specified check also that a command is the given command, not matter if there
   * are parameters
   * @param {String} msg The string to check
   * @param {String} [commandName] The command to check
   * @return {Boolean}
   */
  isCommand: function(msg, commandName) {
    if (!_.isString(msg)) {
      return false;
    }
    if (_.isEmpty(commandName)) {
      return msg.match(/^\/.*/) != null;
    } else {
      var matched = msg.match(/^\/(\w+)/);
      return matched != null && ('/' + matched[1]) === commandName;
    }
  }

};
