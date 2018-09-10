var _ = require('underscore');
var _s = require('underscore.string');
var clc = require('cli-color');
var prettyjson = require('prettyjson');
var utils = require('../helpers/utils');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var lcd = require('../helpers/lcd');

var when = utils.when;
var green = clc.greenBright;
var white = clc.white;
//var grey = clc.blackBright;
var yellow = clc.yellow;
//var notice = clc.blue;
var red = clc.red;
var orange = clc.xterm(214);
var grey = clc.blackBright;

var _messageTypes = [
  { value: 'audio', label: 'Audio' },
  { value: 'buttons', label: 'Buttons' },
  { value: 'command', label: 'Command' },
  { value: 'contact', label: 'Contact' },
  { value: 'dialog', label: 'Dialog' },
  { value: 'document', label: 'Document' },
  { value: 'inline-buttons', label: 'Inline buttons' },
  { value: 'inline-query', label: 'Inline Query' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'invoice-shipping', label: 'Invoice Shipping Query' },
  { value: 'location', label: 'Location' },
  { value: 'message', label: 'Text' },
  { value: 'photo', label: 'Photo' },
  { value: 'payment', label: 'Payment' },
  { value: 'request', label: 'Request' },
  { value: 'response', label: 'Dialog Response' },
  { value: 'video', label: 'Video' }
];

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
    routesDescription: null,
    events: null,
    relaxChatId: false
  }, options);

  this.ins = [];
  this.outs = [];
  this.uses = [];

  // configuration warnings
  if (_.isEmpty(this.options.chatIdKey) && !_.isFunction(this.options.chatIdKey)) {
    // eslint-disable-next-line no-console
    console.log(yellow('WARNING: chatIdKey option is empty'));
  }
  if (_.isEmpty(this.options.userIdKey) && !_.isFunction(this.options.userIdKey)) {
    // eslint-disable-next-line no-console
    console.log(yellow('WARNING: userIdKey option is empty'));
  }
  if (_.isEmpty(this.options.transport)) {
    // eslint-disable-next-line no-console
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

  function parseMessage(payload, options, chatServer) {

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
    evaluateParam(payload, 'language', 'language');
    // evaluate callbacks
    var callbacks = chatServer.getCallbacks();
    _(['chatId', 'userId', 'ts', 'type', 'language', 'messageId']).each(function(callbackName) {
      if (_.isFunction(callbacks[callbackName])) {
        payload[callbackName] = callbacks[callbackName].call(chatServer, payload)
      }
    });

    // at this point should have at least the values chatId and type
    if (payload.chatId == null && !options.relaxChatId) {
      throw 'Error: inbound message key "chatId" for transport ' + _this.options.transport + ' is empty\n\n'
        + 'See here: https://github.com/guidone/node-red-contrib-chatbot/wiki/Universal-Connector-node for an ' +
        + 'explanation about this error.';
    }

    return payload;
  }

  function warningInboundMiddleware(message) {
    // check if message is null, perhaps someone forgot to resolve a promise
    if (message == null) {
      // eslint-disable-next-line no-console
      console.log(yellow('WARNING: a middleware is returning an empty message'));
    }
    if (message.payload == null) {
      // eslint-disable-next-line no-console
      console.log(yellow('WARNING: a middleware is returning an empty payload in message'));
    }
  }

  function prepareForConsole(payload) {
    var result = _.clone(payload) || {};
    if (result.content instanceof Buffer) {
      result.content = '<Buffer>';
    }
    if (result.ts != null) {
      result.ts = result.ts.toString();
    }
    return result;
  }

  // eslint-disable-next-line max-params
  function createMessage(chatId, userId, messageId, inboudMessage, chatServer) {

    var options = chatServer.getOptions();
    var contextProvider = options.contextProvider;
    inboudMessage = inboudMessage || {};

    return when(contextProvider.getOrCreate(chatId, {
        chatId: chatId,
        userId: userId,
        messageId: messageId,
        transport: options.transport,
        authorized: false,
        pending: false,
        language: null
      })
    ).then(function() {
      return _.extend({}, inboudMessage, {
        originalMessage: {
          chatId: chatId,
          userId: userId,
          messageId: messageId,
          transport: options.transport,
          language: null
        },
        chat: function() {
          return contextProvider.get(chatId);
        },
        api: function() {
          return chatServer;
        },
        client: function() {
          return options.connector;
        }
      });
    });
  }

  function inboundMessage(payload, chatServer) {
    var contextProvider = chatServer.getOptions().contextProvider;
    if (chatServer.isDebug()) {
      // eslint-disable-next-line no-console
      console.log(orange('-- INBOUND MESSAGE --'));
      // eslint-disable-next-line no-console
      console.log(prettyjson.render(payload));
      // eslint-disable-next-line no-console
      console.log('');
    }
    // parse the message to extract the minimum payload needed for chat-platform to work properly
    // could raise errors, relay to chat server
    try {
      var parsedMessage = parseMessage(payload, _this.options, chatServer);
    } catch(e) {
      chatServer.emit('error', e);
      return;
    }
    // create the node red message structure
    var message = {
      originalMessage: _.extend({}, payload, {
        chatId: parsedMessage.chatId,
        userId: parsedMessage.userId,
        messageId: parsedMessage.messageId,
        transport: parsedMessage.transport,
        language: parsedMessage.language,
        ts: parsedMessage.ts
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
      },
      api: function() {
        return chatServer;
      },
      client: function() {
        return chatServer.getOptions().connector;
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
            language: parsedMessage.language,
            authorized: false
          }));
        })
        .then(function() {
          return when(message);
        });
    } else {
      // eslint-disable-next-line no-console
      console.log(yellow('WARNING: context provider was not specified'));
    }
    // run general middleware
    _(_this.uses.concat(chatServer.getUseMiddleWares())).each(function(filter) {
      stack = stack.then(function(message) {
        // encapsulate the promise to catch the error with the source code of the middleware
        return new Promise(function(resolve, reject) {
          warningInboundMiddleware(message);
          when(filter.call(chatServer, message))
            .then(resolve)
            .catch(function (error) {
              error.sourceCode = filter.toString();
              reject(error);
            });
        });
      });
    });
    // run ins middleware without any specific type
    _(_this.ins.concat(chatServer.getInMiddleWares())).each(function(filter) {
      stack = stack.then(function(message) {
        // encapsulate the promise to catch the error with the source code of the middleware
        return new Promise(function(resolve, reject) {
          warningInboundMiddleware(message);
          // if message type is null
          if (filter.type == null) {
            when(filter.method.call(chatServer, message))
              .then(resolve)
              .catch(function(error) {
                error.sourceCode = filter.method.toString();
                reject(error);
              });
          } else {
            resolve(message)
          }
        });
      });
    });
    // run ins middleware without a specific type
    _(_this.ins).each(function(filter) {
      stack = stack.then(function(message) {
        // encapsulate the promise to catch the error with the source code of the middleware
        return new Promise(function (resolve, reject) {
          warningInboundMiddleware(message);
          // if message type is the same
          if (filter.type === message.payload.type || filter.type === '*') {
            when(filter.method.call(chatServer, message))
              .then(resolve)
              .catch(function(error) {
                error.sourceCode = filter.method.toString();
                reject(error);
              });
          } else {
            resolve(message)
          }
        });
      });
    });
    // finally
    stack
      .then(function(message) {
        if (message.payload != null && message.payload.type != null) {
          if (chatServer.isDebug()) {
            // eslint-disable-next-line no-console
            console.log(orange('-- RELAY MESSAGE --'));
            // eslint-disable-next-line no-console
            console.log(prettyjson.render(prepareForConsole(message.payload)));
            // eslint-disable-next-line no-console
            console.log('');
          }
          chatServer.emit('message', message);
        } else {
          // do nothing
          if (chatServer.isDebug()) {
            // eslint-disable-next-line no-console
            console.log(orange('-- DISCARDED MESSAGE (not handled by middlewares) --'));
            // eslint-disable-next-line no-console
            console.log('');
          }
        }

      })
      .catch(function(error) {
        lcd.dump(error, 'Error in chat-platform.js');
        // dump source code if present
        if (error != null && !_.isEmpty(error.sourceCode)) {
          // eslint-disable-next-line no-console
          console.log(lcd.red(error.sourceCode));
          // eslint-disable-next-line no-console
          console.log('');
        }
        if (chatServer != null) {
          chatServer.emit('error', error);
        }
      });
  }

  function warningOutboundMiddleware(message) {
    if (message == null) {
      // eslint-disable-next-line no-console
      console.log(yellow('WARNING: a middleware is returning an empty value'));
    }
  }

  function outboundMessage(message, chatServer) {

    // check if the message is from telegram
    if (message.originalMessage != null && message.originalMessage.transport !== _this.options.transport) {
      // exit, it's not from the current platform
      if (chatServer.isDebug()) {
        // eslint-disable-next-line no-console
        console.log(yellow('Skipped incoming message for platform: ' + message.originalMessage.transport));
      }
      return;
    }

    if (chatServer.isDebug()) {
      // eslint-disable-next-line no-console
      console.log(orange('-- OUTBOUND MESSAGE --'));
      // eslint-disable-next-line no-console
      console.log(prettyjson.render(prepareForConsole(message.payload)));
      // eslint-disable-next-line no-console
      console.log('');
    }

    // create empty promise
    var stack = new Promise(function(resolve) {
      resolve(message);
    });
    // run general middleware
    _(_this.uses.concat(chatServer.getUseMiddleWares())).each(function(filter) {
      stack = stack.then(function(message) {
        return new Promise(function(resolve, reject) {
          warningOutboundMiddleware(message);
          when(filter.call(chatServer, message))
            .then(resolve)
            .catch(function (error) {
              error.sourceCode = filter.toString();
              reject(error);
            });
        });
      });
    });
    // run outs middleware without a specific typs
    _(_this.outs.concat(chatServer.getOutMiddleWares())).each(function(filter) {
      stack = stack.then(function(message) {
        return new Promise(function(resolve, reject) {
          // check if message is null, perhaps someone forgot to resolve a promise
          warningOutboundMiddleware(message);
          // if message type is the same
          if (filter.type == null) {
            when(filter.method.call(chatServer, message))
              .then(resolve)
              .catch(function (error) {
                error.sourceCode = filter.toString();
                reject(error);
              });
          } else {
            resolve(message);
          }
        });
      });
    });
    // run outs middleware with a specific typs
    _(_this.outs.concat(chatServer.getOutMiddleWares())).each(function(filter) {
      stack = stack.then(function(message) {
        return new Promise(function(resolve, reject) {
          // check if message is null, perhaps someone forgot to resolve a promise
          warningOutboundMiddleware(message);
          // if message type is the same
          if (message.payload != null && filter.type === message.payload.type) {
            when(filter.method.call(chatServer, message))
              .then(resolve)
              .catch(function (error) {
                error.sourceCode = filter.toString();
                reject(error);
              });
          } else {
            resolve(message);
          }
        });
      });
    });
    // finally
    return stack
      .catch(function(error) {
        // eslint-disable-next-line no-console
        console.log(red(error));
        if (chatServer != null) {
          chatServer.emit('error', error);
        }
      })
      .then(function(message) {
        return message;
      });
  }

  function unmountEvents(events, chatServer) {
    var options = chatServer.getOptions();
    var connector = options.connector;
    if (connector != null) {
      if (options.inboundMessageEvent != null) {
        connector.off(options.inboundMessageEvent);
      }
      _(events).each(function (callback, eventName) {
        connector.off(eventName);
      });
    }
  }

  function mountEvents(events, chatServer) {
    var connector = chatServer.getOptions().connector;
    if (connector != null && _.isFunction(connector.on)) {
      _(events).each(function (callback, eventName) {
        connector.on(eventName, callback.bind(chatServer));
      });
    }
    return when(true);
  }

  function unmountRoutes(RED, routes, chatServer) {
    if (routes != null) {
      var endpoints = _(routes).keys();
      if (!_.isEmpty(endpoints)) {
        var routesCount = RED.httpNode._router.stack.length;
        var idx = 0;
        var stack = RED.httpNode._router.stack;
        for(; idx < stack.length;) {
          var route = stack[idx];
          if (route != null && route.name != null) {
            var routeName = String(route.name).replace('bound ', '');
            if (_.contains(endpoints, routeName)) {
              stack.splice(idx, 1);
            } else {
              idx += 1;
            }
          } else {
            idx += 1;
          }
        }
        if (RED.httpNode._router.stack.length >= routesCount) {
          // eslint-disable-next-line no-console
          chatServer.error('improperly removed some routes, this will cause unexpected results and tricky bugs');
        }
      }
    }
  }

  // eslint-disable-next-line max-params
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
        console.log(green('http://localhost' + (uiPort != '80' ? ':' + uiPort : '') + route)
          + (description != null ? grey(' - ') + white(description) : ''));
        return null;
      });
      // eslint-disable-next-line no-console
      console.log('');
    }
    return when(true);
  }

  var methods = {

    'in': function() {
      var type = null;
      var method = null;
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
      var type = null;
      var method = null;
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

    registerMessageType: function(type, name) {
      if (type == null || typeof type !== 'string') {
        throw 'Missing type in .registerMessageType()';
      }
      name = name != null ? name : _s.capitalize(type);
      var found = _(_messageTypes).findWhere({value: type});
      if (found == null) {
        _messageTypes.push({ value: type, label: name });
      } else {
        found.label = name;
      }
      return this;
    },

    createServer: function(options) {

      options = _.extend({}, _this.options, options);
      var chatServer = null;
      var _ins = [];
      var _uses = [];
      var _outs = [];
      var _callbacks = {};

      var ChatServer = function(options) {
        this.options = options;
        this.warn = function(msg) {
          var text = '[' + options.transport.toUpperCase() + '] ' + msg;
          // eslint-disable-next-line no-console
          console.log(yellow(text));
          this.emit('warning', text);
        };
        this.error = function(msg) {
          var text = '[' + options.transport.toUpperCase() + '] ' + msg;
          // eslint-disable-next-line no-console
          console.log(red(text));
          this.emit('error', text);
        };
        this.getOptions = function() {
          return this.options;
        };
        this.isDebug = function() {
          return this.options != null && this.options.debug;
        };
        this.getConnector = function() {
          return this.options.connector;
        };
        this.send = function(message) {
          return outboundMessage(message, this);
        };
        this.receive = function(message) {
          inboundMessage(message, this);
        };
        // eslint-disable-next-line max-params
        this.createMessage = function(chatId, userId, messageId, inboudMessage) {
          return createMessage(chatId, userId, messageId, inboudMessage, this);
        };
        this.in = function() {
          var type = null;
          var method = null;
          if (arguments.length === 1) {
            method = arguments[0];
          } else if (arguments.length === 2) {
            type = arguments[0];
            method = arguments[1];
          } else {
            throw '.in() wrong number of parameters';
          }
          _ins.push({
            type: type,
            method: method
          });
          return methods;
        };
        this.getInMiddleWares = function() {
          return _ins;
        };
        this.use = function(method) {
          _uses.push(method);
          return methods;
        };
        this.getUseMiddleWares = function() {
          return _uses;
        };
        this.registerMessageType = function(type, name) {
          if (type == null || typeof type !== 'string') {
            throw 'Missing type in .registerMessageType()';
          }
          name = name != null ? name : _s.capitalize(type);
          var found = _(_messageTypes).findWhere({value: type});
          if (found == null) {
            _messageTypes.push({ value: type, label: name });
          } else {
            found.label = name;
          }
          return this;
        };
        this.out = function() {
          var type = null;
          var method = null;
          if (arguments.length === 1) {
            method = arguments[0];
          } else if (arguments.length === 2) {
            type = arguments[0];
            method = arguments[1];
            // automatically register the type
            this.registerMessageType(type);
          } else {
            throw '.out() wrong number of parameters';
          }
          _outs.push({
            type: type,
            method: method
          });
          return methods;
        };
        this.getOutMiddleWares = function() {
          return _outs;
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
              return mountEvents(options.events, _this);
            })
            .then(function() {
              return _.isFunction(options.onStarted) ? when(options.onStarted.call(_this)) : when(true);
            })
            .then(function() {
              if (_this.isDebug()) {
                // eslint-disable-next-line no-console
                console.log(green('Chat server started, transport: ') + white(options.transport));
              }
              // listen to inbound event
              var connector = options.connector;
              if (connector != null && options.inboundMessageEvent != null) {
                connector.on(options.inboundMessageEvent, function (message) {
                  inboundMessage(message, chatServer);
                });
              }
              _this.emit('start');
            },
            function(error) {
              // eslint-disable-next-line no-console
              _this.error(error);
            });
        };
        this.onChatId = function(callback) {
          _callbacks.chatId = callback;
        };
        this.onUserId = function(callback) {
          _callbacks.userId = callback;
        };
        this.onTimestamp = function(callback) {
          _callbacks.ts = callback;
        };
        this.onLanguage = function(callback) {
          _callbacks.language = callback;
        };
        this.onMessageId = function(callback) {
          _callbacks.messageId = callback;
        };
        this.getCallbacks = function() {
          return _callbacks;
        };
        this.stop = function() {
          this.emit('stop');
          var options = this.getOptions();
          unmountRoutes(options.RED, options.routes, this);
          unmountEvents(options.events, this);
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

// static methods
ChatExpress.getMessageTypes = function() {
  return _messageTypes;
};


module.exports = ChatExpress;








