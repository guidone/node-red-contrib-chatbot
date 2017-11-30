var _ = require('underscore');
var clc = require('cli-color');
var prettyjson = require('prettyjson');
var green = clc.greenBright;
var white = clc.white;
//var grey = clc.blackBright;
var yellow = clc.yellow;
//var notice = clc.blue;
var red = clc.red;
var orange = clc.xterm(214);
var grey = clc.blackBright;
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var ChatExpress = function(options) {

  var _this = this;
  this.options = _.extend({
    contextProvider: null,
    connector: null,
    inboundMessage: null,
    transport: null,
    chatIdKey: null,
    userIdKey: null,
    tsKey: null,
    debug: true,
    onStart: null,
    onStop: null,
    RED: null,
    routes: null,
    routesDescription: null
  }, options);

  this.ins = [];
  this.outs = [];
  this.uses = [];

  // Configuration warnings
  if (_.isEmpty(this.options.chatIdKey) && !_.isFunction(this.options.chatIdKey)) {
    console.log(yellow('WARNING: chatIdKey option is empty'));
  }
  if (_.isEmpty(this.options.userIdKey) && !_.isFunction(this.options.userIdKey)) {
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

    evaluateParam(payload, 'chatId', 'chatIdKey');
    evaluateParam(payload, 'userId', 'userIdKey');
    evaluateParam(payload, 'ts', 'tsKey');
    evaluateParam(payload, 'type', 'type');

    // at this point should have at least the values chatId and type
    if (_.isEmpty(payload.chatId)) {
      throw 'Error: inbound message key "chatId" for transport ' + _this.options.transport + ' is empty\n\n'
        + JSON.stringify(payload);
    }
    if (_.isEmpty(payload.type)) {
      throw 'Error: inbound message key "type" for transport ' + _this.options.transport + ' is empty\n\n'
        + JSON.stringify(payload);
    }

    return payload;
  }

  function warningInboundMiddleware(message) {
    // check if message is null, perhaps someone forgot to resolve a promise
    if (message == null) {
      console.log(yellow('WARNING: a middleware is returning an empty message'));
    }
    if (message.payload == null) {
      console.log(yellow('WARNING: a middleware is returning an empty payload in message'));
    }
  }

  function inboundMessage(payload, chatServer) {

    var contextProvider = chatServer.getOptions().contextProvider;
    if (_this.options.debug) {
      console.log(orange('-- INBOUND MESSAGE --'));
      console.log(prettyjson.render(payload));
      console.log('');
    }
    // parse the message to extract the minimum payload needed for chat-platform to work properly
    // could raise errors, relay to chat server
    try {
      var parsedMessage = parseMessage(payload);
    } catch(e) {
      chatServer.emit('error', e);
      return;
    }
    // create the node red message structure
    var message = {
      originalMessage: _.extend({}, payload, {
        chatId: parsedMessage.chatId,
        userId: parsedMessage.userId,
        transport: parsedMessage.transport
      }),
      payload: {
        type: parsedMessage.type,
        chatId: parsedMessage.chatId,
        userId: parsedMessage.userId,
        ts: parsedMessage.ts,
        transport: parsedMessage.transport,
        inbound: true
      },
      chat: function() {
        return contextProvider.get(parsedMessage.chatId);
      }
    };
    // create empty promise
    var stack = new Promise(function(resolve) {
      resolve(message);
    });
    // if any context provider, then create the context
    if (contextProvider != null) {
      stack = stack
        .then(function() {
          return when(contextProvider.getOrCreate(parsedMessage.chatId, {
            chatId: parsedMessage.chatId,
            userId: parsedMessage.userId,
            transport: parsedMessage.transport,
            authorized: false
          }));
        })
        .then(function() {
          return when(message);
        });
    } else {
      console.log(yellow('WARNING: context provider was not specified'));
    }
    // run general middleware
    _(_this.uses).each(function(filter) {
      stack = stack.then(function(message) {
        warningInboundMiddleware(message);
        return filter.call(chatServer, message);
      });
    });
    // run ins middleware without any specific type
    _(_this.ins).each(function(filter) {
      stack = stack.then(function(message) {
        warningInboundMiddleware(message);
        // if message type is the same
        if (filter.type == null) {
          return filter.method.call(chatServer, message);
        } else {
          return message;
        }
      });
    });
    // run ins middleware without a specific type
    _(_this.ins).each(function(filter) {
      stack = stack.then(function(message) {
        warningInboundMiddleware(message);
        // if message type is the same
        if (filter.type === message.payload.type || filter.type === '*') {
          return filter.method.call(chatServer, message);
        } else {
          return message;
        }
      });
    });
    // finally
    stack
      .then(function(message) {
        if (_this.options.debug) {
          console.log(orange('-- RELAY MESSAGE --'));
          console.log(prettyjson.render(prepareForConsole(message.payload)));
          console.log('');
        }
        chatServer.emit('message', message);
      })
      .catch(function(error) {
        console.log(red(error));
        chatServer.emit('error', error);
      });
  }

  function warningOutboundMiddleware(message) {
    if (message == null) {
      console.log(yellow('WARNING: a middleware is returning an empty value'));
    }
  }

  function prepareForConsole(payload) {
    var result = _.clone(payload);
    if (result.content instanceof Buffer) {
      result.content = '<Buffer>';
    }
    if (result.ts != null) {
      result.ts = result.ts.toString();
    }
    return result;
  }

  function outboundMessage(message, chatServer) {

    // check if the message is from telegram
    if (message.originalMessage != null && message.originalMessage.transport !== _this.options.transport) {
      // exit, it's not from the current platform
      if (_this.options.debug) {
        console.log(yellow('Skipped incoming message for platform: ' + msg.originalMessage.transport));
      }
      return;
    }

    if (_this.options.debug) {
      console.log(orange('-- OUTBOUND MESSAGE --'));
      console.log(prettyjson.render(prepareForConsole(message.payload)));
      console.log('');
    }

    // create empty promise
    var stack = new Promise(function(resolve) {
      resolve(message);
    });
    // run general middleware
    _(_this.uses).each(function(filter) {
      stack = stack.then(function(message) {
        warningOutboundMiddleware(message);
        return filter.call(chatServer, message);
      });
    });
    // run outs middleware without a specific typs
    _(_this.outs).each(function(filter) {
      stack = stack.then(function(message) {
        // check if message is null, perhaps someone forgot to resolve a promise
        warningOutboundMiddleware(message);
        // if message type is the same
        if (filter.type == null) {
          return filter.method.call(chatServer, message);
        } else {
          return message;
        }
      });
    });
    // run outs middleware with a specific typs
    _(_this.outs).each(function(filter) {
      stack = stack.then(function(message) {
        // check if message is null, perhaps someone forgot to resolve a promise
        warningOutboundMiddleware(message);
        // if message type is the same
        if (filter.type === message.payload.type) {
          return filter.method.call(chatServer, message);
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
      .then(function() {
        // done
      });
  }

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

  function unmountRoutes(RED, routes, chatServer) {
    if (routes != null) {
      var endpoints = _(routes).keys();
      if (!_.isEmpty(endpoints)) {
        var routesCount = RED.httpNode._router.stack.length;
        var idx;
        var stack = RED.httpNode._router.stack;
        for(idx = 0; idx < stack.length;) {
          var route = stack[idx];
          if (route != null && route.name != null) {
            var routeName = String(route.name).replace('bound ', '');
            if (_.contains(endpoints, routeName)) {
              stack.splice(idx, 1);
            } else {
              idx++;
            }
          } else {
            idx++;
          }
        }
        if (RED.httpNode._router.stack.length >= routesCount) {
          // eslint-disable-next-line no-console
          chatServer.error('improperly removed some routes, this will cause unexpected results and tricky bugs');
        }
      }
    }
  }

  function mountRoutes(RED, routes, routesDescription, chatServer) {
    if (routes != null && RED == null) {
      chatServer.warn('"RED" param is empty, impossible to mount the routes');
    }
    if (routes != null && RED != null) {
      var uiPort = RED.settings.get('uiPort');
      var options = chatServer.getOptions();
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(grey('------ WebHooks for ' + options.transport.toUpperCase() + '----------------'));
      _(routes).map(function (middleware, route) {
        RED.httpNode.use(route, middleware.bind(chatServer));
        var description = null;
        if (routesDescription != null && _.isString(routesDescription[route])) {
          description = routesDescription[route];
        } else if (routesDescription != null && _.isFunction(routesDescription[route])) {
          description = routesDescription[route].call(chatServer);
        }
        // eslint-disable-next-line no-console
        console.log(green('http://localhost' + (uiPort != '80' ? ':' + uiPort : '') + route) +
          (description != null ? grey(' - ') + white(description) : ''));
      });
      // eslint-disable-next-line no-console
      console.log('');
    }
    return when(true);
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

    mixin: function(obj) {
      _this._mixins = _.extend(_this._mixin || {}, obj);
      return methods;
    },

    createServer: function(options) {

      options = _.extend({}, _this.options, options);
      var chatServer = null;

      var ChatServer = function(options) {
        this.options = options;
        this.warn = function(msg) {
          console.log(yellow('[' + options.transport.toUpperCase() + '] ' + msg));
        };
        this.error = function(msg) {
          console.log(red('[' + options.transport.toUpperCase() + '] ' + msg));
        };
        this.getOptions = function() {
          return this.options;
        };
        this.getConnector = function() {
          return this.options.connector;
        };
        this.send = function(message) {
          outboundMessage(message, this);
        };
        this.receive = function(message) {
          inboundMessage(message, this);
        };
        this.start = function() {
          var _this = this;
          var stack = when(true);
          var options = this.getOptions();
          if (_.isFunction(options.onStart)) {
            // execute on start callback, ensure it's a properly chained promise
            stack = stack.then(function() {
              return when(options.onStart.call(chatServer));
            });
          }
          return stack
            .then(function() {
              return mountRoutes(options.RED, options.routes, options.routesDescription, _this);
            })
            .then(function() {
              if (options.debug) {
                console.log(green('Chat server started, transport: ') + white(options.transport));
              }
              // listen to inbound event
              var connector = options.connector;
              connector.on(options.inboundMessageEvent, function(message) {
                inboundMessage(message, chatServer);
              });
              _this.emit('start');
            },
            function(error) {
              console.log(red('Error on Start'), error);
            });
        };
        this.stop = function() {
          this.emit('stop');
          var options = this.getOptions();
          unmountRoutes(options.RED, options.routes, this);
          var stack = when(true);
          if (_.isFunction(options.onStop)) {
            stack = stack.then(function() {
              return when(options.onStop.call(chatServer));
            });
          }
          return stack;
        };
        EventEmitter.call(this);
      };
      inherits(ChatServer, EventEmitter);
      _.extend(ChatServer.prototype, _this._mixins);
      // create chat instance
      chatServer = new ChatServer(options);
      return chatServer;
    }

  };
  return methods;
};

module.exports = ChatExpress;








