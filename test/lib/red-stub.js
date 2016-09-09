var _ = require('underscore');
var ChatContext = require('../../lib/chat-context.js');

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

  var RED = {

    environment: {
      chat: function(chatId, obj) {
        _(obj).map(function(value, key) {
          _chatContext.set(key, value);
        });
      }
    },

    createMessage: function(payload, transport) {
      var chatId = 42;
      var msg = {
        originalMessage: {
          transport: transport != null ? transport : 'telegram',
          chat: {
            id: chatId
          },
          message_id: 72
        },
        payload: payload != null ? payload : 'I am the original message'
      };
      _chatContext = ChatContext(chatId);
      _global['chat:' + chatId] = _chatContext;
      if (payload != null) {
        msg.payload = payload;
      }
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

      createNode: function(node, config) {

        node.on = function(eventName, cb) {
          if (eventName == 'input') {
            _cbInput = cb;
          }
        };
        node.emit = function(eventName, msg) {
          if (eventName == 'input') {
            _message = null;
            _cbInput(msg);
          }
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
            global: {
              get: function(key) {
                return _global[key];
              },
              set: function(key, value) {
                _global[key] = value;
                return this;
              }
            },
            chat: {
              get: function(key) {
                return _chatContext.get(key);
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
