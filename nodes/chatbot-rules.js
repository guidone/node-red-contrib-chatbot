var utils = require('../lib/helpers/utils');
var _ = require('underscore');
var when = utils.when;

var Types = {

  inbound: function(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.inbound === true) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  command: function(rule, message) {
    var commandToCheck = rule.command.match(/^\//) ? rule.command : '/' + rule.command;
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.content === commandToCheck) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  outbound: function(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.inbound === false) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  isTopicEmpty: function(rule, message) {
    return new Promise(function(resolve, reject) {
      var chatContext = message.chat();
      when(chatContext.get('topic'))
        .then(
          function(topic) {
            if (_.isEmpty(topic)) {
              resolve(rule);
            } else {
              reject();
            }
          },
          function() {
            reject();
          });
    });

  },

  catchAll: function(rule) {
    return new Promise(function (resolve) {
      resolve(rule);
    });
  },

  isNotTopic: function(rule, message) {
    return new Promise(function (resolve, reject) {
      var chatContext = message.chat();
      when(chatContext.get('topic'))
        .then(
          function (topic) {
            if (topic !== rule.topic) {
              resolve(rule);
            } else {
              reject();
            }
          },
          function () {
            reject();
          });
    });
  },

  isTopic: function(rule, message) {
    return new Promise(function (resolve, reject) {
      var chatContext = message.chat();
      when(chatContext.get('topic'))
        .then(
          function (topic) {
            if (topic === rule.topic) {
              resolve(rule);
            } else {
              reject();
            }
          },
          function () {
            reject();
          });
    });
  },

  hasNotVariable: function(rule, message) {
    return new Promise(function (resolve, reject) {
      var chatContext = message.chat();
      when(chatContext.get(rule.variable))
        .then(
          function (content) {
            if (content == null) {
              resolve(rule);
            } else {
              reject();
            }
          },
          function () {
            reject();
          });
    });
  },

  hasVariable: function(rule, message) {
    return new Promise(function (resolve, reject) {
      var chatContext = message.chat();
      when(chatContext.get(rule.variable))
        .then(
          function (content) {
            if (content != null) {
              resolve(rule);
            } else {
              reject();
            }
          },
          function () {
            reject();
          });
    });
  }

};

/**
 * @method executeRules
 * Execute a set of rules, the first rules that complies resolve the promise with argument the rule (augumented with
 * the position of the rule in the list)
 * @deferred
 * @param {Array} rules
 * @param {Object} message
 * @param {Number} [current=1]
 */
function executeRules(rules, message, current) {

  current = current || 1;

  if (_.isEmpty(rules)) {
    // if empty, means all rules failed
    return new Promise(function(resolve, reject) {
      reject();
    });
  }

  var first = _(rules).first();
  return new Promise(function(resolve, reject) {
    // rules doesn't exist
    if (!_.isFunction(Types[first.type])) {
      reject();
    }
    // check if the first rule applies
    Types[first.type](first, message)
      .then(
        function () {
          var rule = _.clone(first);
          rule.index = current;
          resolve(rule);
        },
        function () {
          var nextRules = _.rest(rules);
          if (_.isEmpty(nextRules)) {
            reject();
          } else {
            executeRules(nextRules, message, current + 1)
              .then(
                function(rule) {
                  resolve(rule);
                },
                function() {
                  reject();
                }
              );
          }
        }
      );
  });
}

module.exports = function(RED) {

  function ChatBotRules(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.rules = config.rules;

    this.on('input', function(msg) {
      var rules = utils.extractValue('arrayOfObject', 'rules', node, msg, true);
      executeRules(rules, msg)
        .then(
          function(rule) {
            var result = new Array(rules.length);
            result = _(result).map(function(value, idx) {
              return idx === (rule.index - 1) ? msg : null
            });
            node.send(result);
          },
          function() {
            // all rules failed, do nothing
          }
        );
    });
  }

  RED.nodes.registerType('chatbot-rules', ChatBotRules);
};
