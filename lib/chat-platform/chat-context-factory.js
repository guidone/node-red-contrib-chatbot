var _ = require('underscore');

var contextProviders = {};
contextProviders.memory = require('./providers/memory');
contextProviders['plain-file'] = require('./providers/plain-file');

module.exports = function(RED) {

  RED = RED || {};
  // register Slack server
  if (RED.redbot == null) {
    RED.redbot = {};
  }
  if (RED.redbot.contextProviders == null) {
    RED.redbot.contextProviders = {};
  }

  if (RED.settings != null) {
    RED.settings.set('contextProviders', contextProviders);
  }

  if (RED.redbot.utils == null) {
    RED.redbot.utils = {
      when: function (param) {
        if (param != null && _.isFunction(param.then)) {
          return param;
        } else if (param != null) {
          return new Promise(function(resolve) {
            resolve(param);
          })
        }
        return new Promise(function(resolve, reject) {
          reject();
        });
      }
    };
  }

  var methods = {

    when: function (param) {
      if (param != null && _.isFunction(param.then)) {
        return param;
      } else if (param != null) {
        return new Promise(function(resolve) {
          resolve(param);
        })
      }
      return new Promise(function(resolve, reject) {
        reject();
      });
    },

    getProviders: function() {
      return _.keys(contextProviders);
    },

    hasProvider: function(provider) {
      return _(methods.getProviders()).contains(provider);
    },

    getProvider: function(providerName, params) {
      var provider = contextProviders[providerName];
      return new provider(params);
    }

  };
  return methods;
};
