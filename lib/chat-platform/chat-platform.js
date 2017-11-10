var _ = require('underscore');
var clc = require('cli-color');
var prettyjson = require('prettyjson');
var green = clc.greenBright;
var white = clc.white;
var grey = clc.blackBright;
var yellow = clc.yellow;
var notice = clc.blue;
var red = clc.red;
var orange = clc.xterm(214);
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var ChatExpress = function(options) {

  var _this = this;
  this.options = _.extend({
    store: null,
    connector: null,
    inboundMessage: null,
    transport: null,
    chatIdKey: null,
    userIdKey: null,
    tsKey: null,
    debug: true
  }, options);

  this.ins = [];
  this.outs = [];
  this.uses = [];

  // Configuration warnings
  if (_.isEmpty(this.options.chatIdKey)) {
    console.log(yellow('WARNING: chatIdKey option is empty'));
  }
  if (_.isEmpty(this.options.userIdKey)) {
    console.log(yellow('WARNING: userIdKey option is empty'));
  }
  if (_.isEmpty(this.options.transport)) {
    console.log(yellow('WARNING: transport option is empty'));
  }

  function evaluateParam(payload, newKey, optionKey) {
    var options = _this.options;
    if (options[optionKey] != null) {
      if (_.isString(options[optionKey]) && newKey != options[optionKey]) {
        payload[newKey] = payload[options[optionKey]];
        delete payload[options[optionKey]];
      } else if (_.isFunction(options[optionKey])) {
        payload[newKey] = options[optionKey](payload);
      }
    }
  }


  function parseMessage(payload) {

    payload = _.clone(payload);

    // sets inbound
    payload.inbound = true;
    // sets the transport
    if (!_.isEmpty(_this.options.transport)) {
      payload.transport = _this.options.transport;
    }

    // generalize here
    /*if (!_.isEmpty(_this.options.chatIdKey) && _.isString(_this.options.chatIdKey)) {
      payload.chatId = payload[_this.options.chatIdKey];
      delete payload[_this.options.chatIdKey];
    }*/
    /*if (!_.isEmpty(_this.options.userIdKey) && _.isString(_this.options.userIdKey)) {
      payload.userId = payload[_this.options.userIdKey];
      delete payload[_this.options.userIdKey];
    }*/
    evaluateParam(payload, 'chatId', 'chatIdKey');
    evaluateParam(payload, 'userId', 'userIdKey');
    evaluateParam(payload, 'ts', 'tsKey');

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
    var parsedMessage = parseMessage(payload);
    // create the node red message structure
    var message = {
      originalMessage: _.clone(parsedMessage),
      payload: parsedMessage,
      chat: function() {
        if (chatServer.getStore() != null) {
          return chatServer.getStore().createChatContext({}, parsedMessage.chatId);
        }
        return null;
      }
    };
    // create the store if any
    if (chatServer.getStore() != null) {
      var chat = chatServer.getStore().getOrCreateChatContext({}, parsedMessage.chatId);
      chat.set('chatId', parsedMessage.chatId);
      chat.set('userId', parsedMessage.userId);
      chat.set('transport', parsedMessage.transport);
    }
    // create empty promise
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
        if (filter.type == null || filter.type === message.payload.type) {
          return filter.method(message);
        } else {
          return message;
        }
      });
    });
    // finally
    stack
      .then(function(message) {
        if (_this.options.debug) {
          // prepare the message for debug, stringify timestamp
          var debugMessage = _.clone(message.payload);
          if (debugMessage.ts != null) {
            debugMessage.ts = debugMessage.ts.toString();
          }
          console.log(orange('-- RELAY MESSAGE --'));
          console.log(prettyjson.render(debugMessage));
          console.log('');
        }
        chatServer.emit('message', message);
      })
      .catch(function(error) {
        console.log(red(error));
        chatServer.emit('error', error);
      });
  }

  function outboundMessage(message, chatServer) {

    // create empty promise
    var stack = new Promise(function(resolve) {
      resolve(message);
    });

    // run ins middleware
    _(_this.outs).each(function(filter) {
      stack = stack.then(function(message) {
        // check if message is null, perhaps someone forgot to resolve a promise
        if (message == null) {
          console.log(yellow('WARNING: a middleware is returning an empty value'));
        }
        // if message type is the same
        if (filter.type == null || filter.type === message.payload.type) {
          return filter.method(message, chatServer.options.connector, chatServer);
        } else {
          return message;
        }
      });
    });

    // finally
    stack
      .catch(function(error) {
        console.log(red(error));
        chatServer.emit('error', error);
      })
      .then(function(message) {
        console.log('finito out');
      })
      ;
  }

  var methods = {

    'in': function() {
      var type, method = null;
      if (arguments.length === 1) {
        method = arguments[0];
      } else if (arguments.length === 2) {
        type = arguments[0];
        method = arguments[1];
      } else {
        throw '.in() wrong number of parameters';
      }

      _this.ins.push({
        type: type,
        method: method
      });
      return methods;
    },

    out: function() {
      var type, method = null;
      if (arguments.length === 1) {
        method = arguments[0];
      } else if (arguments.length === 2) {
        type = arguments[0];
        method = arguments[1];
      } else {
        throw '.out() wrong number of parameters';
      }
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
        this.getStore = function() {
          return this.options.store;
        };
        this.send = function(message) {
          outboundMessage(message, this);
        };
        EventEmitter.call(this);
      };
      inherits(ChatServer, EventEmitter);
      // create chat instance
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








