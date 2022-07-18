/* eslint-disable */
const _ = require('underscore');
const ChatContextFactory = require('chat-platform').ContextProviders({});
const ChatContextProvider = ChatContextFactory.getProvider('memory', {});

module.exports = function() {

  var _cbInput = null;
  var _type = null;
  var _factory = null;
  var _node = null;
  var _config = null;
  var _message = null;
  var _flow = {};
  var _global = {};
  var _chatContext = null;
  var _nodecontext = {};
  var _error = null;
  var _nodes = {};

  var RED = {
    settings: {
      RedBot: {
        environment: 'development'
      },
      set: () => {}
    },

    global:  {
      get: function(key) {
        return _global[key];
      },
      set: function(key, value) {
        _global[key] = value;
        return this;
      }
    },

    util: {
      cloneMessage: function(msg) {
        return msg
      }
    },

    environment: {
      chat: function(chatId, obj) {
        _(obj).map(function(value, key) {
          _chatContext.set(key, value);
        });
      }
    },

    createMessage: function(payload, transport, global) {
      var chatId = 42;
      // create a chat context if doesn't exists

      var msg = {
        originalMessage: {
          chatId: chatId,
          userId: 43,
          transport: transport != null ? transport : 'telegram',
          chat: {
            id: chatId
          },
          messageId: 72
        },
        chat: function() {
          return ChatContextProvider.getOrCreateContextSync(chatId);
        },
        payload: payload != null ? payload : 'I am the original message'
      };
      _global = _.extend({}, global);
      if (global != null && global.environment != null) {
        RED.settings.RedBot.environment = global.environment;
      }
      //_chatContext = ChatContext(chatId);
      //_chatContext.clear();
      msg.chat().clear();
      // store it
      //ChatContextStore.set(chatId, _chatContext);
      if (payload != null) {
        msg.payload = payload;
      }
      return msg;
    },

    createRawMessage: function(payload = {}, transport, global) {
      var chatId = 42;
      // create a chat context if doesn't exists

      var msg = {
        originalMessage: {
          chatId: chatId,
          transport: transport != null ? transport : 'telegram',
          chat: {
            id: chatId
          },
          message_id: 72
        },
        chat: function() {
          return ChatContextProvider.getOrCreateContextSync(chatId);
        },
        ...payload
      };
      _global = _.extend({}, global);
      msg.chat().clear();
      return msg;
    },

    events: {
      on: function() {
        // do nothing
      }
    },

    node: {
      config: function(config) {
        _config = config;
      },
      clear: function() {
        _nodecontext = {};
      },
      message: function(idx) {
        if (_.isArray(_message)) {
          return idx != null ? _message[idx] : _message[0];
        } else {
          return _message;
        }
      },
      error: function() {
        return _error;
      },
      get: function(idx) {
        return idx != null ? _node[idx] : _node;
      },
      context: function() {
        return _node.context();
      }
    },

    nodes: {
      registerType: function(type, factory) {
        _type = type;
        _factory = factory;
        factory(_config);
      },

      getNode: function(nodeId) {
        return _nodes[nodeId];
      },

      setNode: function(nodeId, node) {
        _nodes[nodeId] = node;
      },

      eachNode: cb => {
        Object.values(_nodes).forEach(cb);
      },

      /**
       * @method createNode
       * Mock createdNode called when initializing a custom node
       */
      createNode: function(node, config) {

        node.on = function(eventName, cb) {
          if (eventName === 'input') {
            _cbInput = cb;
          }
        };
        node.emit = function(eventName, msg) {
          if (eventName === 'input') {
            _message = null;
            _cbInput(msg);
          }
        };
        node.await = function() {
          var retries = 0;
          var intervalId = null;
          return new Promise(function(resolve, reject) {
            intervalId = setInterval(function() {
              if (_message !== null) {
                clearInterval(intervalId);
                resolve();
              } else if (_error != null) {
                clearInterval(intervalId);
                reject(_error);
              } else if (retries > 20) {
                clearInterval(intervalId);
                reject();
              } else {
                retries++;
              }
            }, 30);
          });
        };
        node.send = function(msg) {
          _message = msg;
        };
        node.error = function(msg) {
          _error = msg;
        };
        node.context = function() {
          return {
            flow: {
              get: function(key) {
                return _flow[key];
              },
              set: function(key, value) {
                _flow[key] = value;
                return this;
              }
            },
            global: _.extend({}, _global, {
              get: function(key) {
                return _global[key];
              },
              set: function(key, value) {
                _global[key] = value;
                return this;
              }
            }),
            chat: {
              get: function(key) {
                return _chatContext.get(key);
              },
              set: function(key, value) {
                _chatContext.set(key, value);
              }
            },
            get: function(key) {
              return _nodecontext[key];
            },
            set: function(key, value) {
              _nodecontext[key] = value;
              return this;
            }
          };
        };
        node.wires = [{}, null];
        _node = node;
      }
    }

  };

  return RED;
};
/* eslint-enable */
