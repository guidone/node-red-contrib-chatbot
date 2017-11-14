var _ = require('underscore');

var contextProviders = {};
contextProviders.memory = require('./providers/memory');
contextProviders['plain-file'] = require('./providers/plain-file');

function when(param) {
  if (param != null && _.isFunction(param.then)) {
    return param;
  } else if (param != null) {
    return new Promise(function(resolve) {
      resolve(param);
    })
  } else {
    return new Promise(function(resolve, reject) {
      reject();
    });
  }
}

module.exports = function(RED) {


  // register Slack server
  if (RED.redbot == null) {
    RED.redbot = {};
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
        } else {
          return new Promise(function(resolve, reject) {
            reject();
          });
        }
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
      } else {
        return new Promise(function(resolve, reject) {
          reject();
        });
      }
    },

    getProviders: function() {
      return _.keys(contextProviders);
    },

    hasProvider: function(provider) {
      return _(methods.getProviders()).contains(provider);
    },

    getProvider: function(providerName, params) {
      var provider = contextProviders[providerName];
      console.log('called factory provider', providerName, params);
      return new provider(params);
    }


    /*createChatContext: function(node, chatId) {
      var store = _store;
      var chatContext = ChatContext(chatId);
      store[chatId] = chatContext;
      return chatContext;
    },

    getOrCreateChatContext: function(provider, chatId, defaults) {

      console.log('getOrCreateChatContext---', provider, chatId, defaults);


      return {};
    }*/

  };
  return methods;
};
