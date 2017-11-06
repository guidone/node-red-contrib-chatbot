var _ = require('underscore');
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

var ChatExpress = function(options) {

  var _this = this;
  this.options = _.extend({
    connector: null,
    inboundMessage: null
  }, options);

  this.ins = [];
  this.outs = [];
  this.uses = [];

  function inboundMessage(payload) {

    // todo check here if there chatId and type or error


    var message = {
      payload: payload
    };
    var stack = new Promise(function(resolve) {
      resolve(message);
    });

    _(_this.uses).each(function(filter) {
      stack = stack.then(function(message) {
        if (message == null) {
          console.log('WARN: a middleware is returning an empty value');
        }
        return filter(message);
      });
    });
    _(_this.ins).each(function(filter) {

      //console.log('CHECK', payload.type , filter.type, payload.type === filter.type);
      stack = stack.then(function(message) {
        // check if message is null, perhaps someone forgot to resolve a promise
        if (message == null) {
          console.log('WARN: a middleware is returning an empty value');
        }
        // if message type is the same
        if (message.payload.type === filter.type) {
          return filter.method(message);
        } else {
          return message;
        }
      });
    });


    // finally
    stack.then(
      function(message) {
        console.log('FINAL', message);
      },
      function(error) {
        console.log('ERRRO', error);
      });



  }


  var methods = {

    'in': function(type, method) {
      _this.ins.push({
        type: type,
        method: method
      });
      return methods;
    },

    out: function(type, method) {
      _this.outs.push({
        type: type,
        method: method
      });
      return methods;
    },

    use: function(method) {
      _this.uses.push(method);
      return methods;
    },

    createServer: function(options) {

      options = _.extend({}, _this.options, options);

      var instance = {
        options: options
      };


      var connector = options.connector;
      var channel = null;

      console.log('listening', options.inboundMessageEvent);
      //node.rtm.on(RTM_EVENTS.MESSAGE, function (botMsg) {
      connector.on(options.inboundMessageEvent, inboundMessage.bind(_this));



      // you need to wait for the client to fully connect before you can send messages
      /*connector.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, function () {
        connector.sendMessage("Hello!", 'D1PVCDUKZ');
      });*/


      return instance;

    }

  };
  return methods;
};


module.exports = ChatExpress;








