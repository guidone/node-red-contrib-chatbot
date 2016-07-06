var _ = require('underscore');

module.exports = function() {

  var _cbInput = null;
  var _type = null;
  var _factory = null;
  var _node = null;
  var _config = null;
  var _message = null;

  var RED = {

    createMessage: function(payload) {
      var msg = {
        originalMessage: {
          chat: {
            id: 42
          },
          message_id: 72
        },
        payload: 'I am the original message'
      };
      if (payload != null) {
        msg.payload = payload;
      }
      return msg;
    },

    events: {
      on: function() {

      }
    },

    node: {
      config: function(config) {
        _config = config;
      },
      message: function() {
        return _message;
      },
      get: function() {
        return _node;
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
          if (_.isArray(msg)) {
            _message = msg[0];
          } else {
            _message = msg;
          }
        };
        node.error = function(msg) {
          console.log(msg);
        };
        node.context = function() {
          return {
            flow: {
              get: function() {
                return null;
              }
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
