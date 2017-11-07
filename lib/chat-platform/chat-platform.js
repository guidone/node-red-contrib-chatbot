var _ = require('underscore');
var clc = require('cli-color');
var prettyjson = require('prettyjson');
var green = clc.greenBright;
var white = clc.white;
var grey = clc.blackBright;
var yellow = clc.yellow;
var notice = clc.blue;
var orange = clc.xterm(214);
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var ChatExpress = function(options) {

  var _this = this;
  this.options = _.extend({
    connector: null,
    inboundMessage: null,
    transport: null,
    chatIdKey: null,
    debug: true
  }, options);

  this.ins = [];
  this.outs = [];
  this.uses = [];

  // Configuration warnings
  if (_.isEmpty(this.options.chatIdKey)) {
    console.log(yellow('WARNING: chatIdKey option is empty'));
  }
  if (_.isEmpty(this.options.transport)) {
    console.log(yellow('WARNING: transport option is empty'));
  }


  function parseMessage(payload) {

    payload = _.clone(payload);

    if (!_.isEmpty(_this.options.transport)) {
      payload.transport = _this.options.transport;
    }

    // generalize here
    if (!_.isEmpty(_this.options.chatIdKey) && _.isString(_this.options.chatIdKey)) {
      payload.chatId = payload[_this.options.chatIdKey];
    }

    return payload;
  }

  function inboundMessage(payload, chatServer) {

    if (_this.options.debug) {
      console.log(orange('-- INBOUND MESSAGE --'));
      console.log(prettyjson.render(payload));
      console.log('');
    }

    // todo check here if there chatId and type or error
    // parse the message to extract the minimum payload needed for chat-platform to work properly
    payload = parseMessage(payload);


    var message = {
      payload: payload
    };
    var stack = new Promise(function(resolve) {
      resolve(message);
    });
    // run general middleware
    _(_this.uses).each(function(filter) {
      stack = stack.then(function(message) {
        if (message == null) {
          console.log(yellow('WARNING: a middleware is returning an empty value'));
        }
        return filter(message);
      });
    });
    // run ins middleware
    _(_this.ins).each(function(filter) {

      stack = stack.then(function(message) {
        // check if message is null, perhaps someone forgot to resolve a promise
        if (message == null) {
          console.log(yellow('WARNING: a middleware is returning an empty value'));
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
        if (_this.options.debug) {
          console.log(orange('-- RELAY MESSAGE --'));
          console.log(prettyjson.render(message.payload));
          console.log('');
        }
        chatServer.emit('message', message.payload);
      },
      function(error) {
        console.log(red(error));
        chatServer.emit('error', message.payload);
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

      var ChatServer = function(options) {
        this.options = options;
        EventEmitter.call(this);
      };
      inherits(ChatServer, EventEmitter);


      var chatServer = new ChatServer(options);

      console.log(green('Chat server started, transport: ') + white(options.transport));

      var connector = options.connector;
      connector.on(options.inboundMessageEvent, function(message) {
        inboundMessage(message, chatServer);
      });








      return chatServer;

    }

  };
  return methods;
};


module.exports = ChatExpress;








