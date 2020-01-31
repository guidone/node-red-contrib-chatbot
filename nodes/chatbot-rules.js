const utils = require('../lib/helpers/utils');
const helpers = require('../lib/helpers/regexps');
const _ = require('underscore');
const RegisterType = require('../lib/node-installer');

const when = utils.when;

const Types = {

  isLanguage(rule, message) {
    return new Promise((resolve, reject) => {
      var chatContext = message.chat();
      when(chatContext.get('language'))
        .then(language => {
          if (rule.language === language) {
            resolve(rule);
          } else {
            reject();
          }
        });      
    });
  },

  isTransportPreferred(rule, message) {
    return new Promise((resolve, reject) => {
      message.isTransportPreferred(rule.transport, message)
        .then(
          isAvailable => {
            if (isAvailable) {
              resolve(rule)
            } else {
              reject();
            }
          },
          () => reject()
        );
    });
  },

  isTransportAvailable(rule, message) {
    return new Promise((resolve, reject) => {
      message.isTransportAvailable(rule.transport, message)
        .then(
          isAvailable => {
            if (isAvailable) {
              resolve(rule)
            } else {
              reject();
            }
          },
          () => reject()
        );
    });
  },

  isSlotConfirmationStatus(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.type === 'intent' && message.payload.slotConfirmationStatus != null
        && message.payload.slotConfirmationStatus[rule.slot] === rule.confirmationStatus) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  isIntentConfirmationStatus(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.type === 'intent'
        && message.payload.confirmationStatus === rule.confirmationStatus) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  isIntentName(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.type === 'intent' && message.payload.intent === rule.intent) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  isIntent(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.type === 'intent') {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  dialogState(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.type === 'intent' && message.payload.dialogState === rule.state) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  pending(rule, message) {
    return new Promise(function(resolve, reject) {
      var chatContext = message.chat();
      when(chatContext.get('pending'))
        .then(function(pending) {
          if (pending) {
            resolve(rule);
          } else {
            reject();
          }
        });
    });
  },

  notPending(rule, message) {
    return new Promise(function(resolve, reject) {
      var chatContext = message.chat();
      when(chatContext.get('pending'))
        .then(function(pending) {
          if (!pending) {
            resolve(rule);
          } else {
            reject();
          }
        });
    });
  },

  isVariable(rule, message) {
    return new Promise(function(resolve, reject) {
      var chatContext = message.chat();
      when(chatContext.get(rule.variable))
        .then(
          function(variable) {
            if (variable === rule.value) {
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

  transport(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message != null && message.payload != null) {
        if (message.originalMessage.transport === rule.transport) {
          resolve(rule);
        } else {
          reject();
        }
      }
    });
  },

  messageType(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message != null && message.payload != null) {
        if ((helpers.isCommand(message.payload.content) && rule.messageType === 'command') ||
          (message.payload.type === rule.messageType)) {
          resolve(rule);
        } else {
          reject();
        }
      }
    });
  },

  messageEvent(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message != null && message.payload != null) {
        if (message.payload.type === 'event' && message.payload.eventType === rule.event) {
          resolve(rule);
        } else {
          reject();
        }
      }
    });
  },

  notMessageType(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message != null && message.payload != null) {
        if ((helpers.isCommand(message.payload.content) && rule.messageType === 'command') ||
          (message.payload.type === rule.messageType)) {
          reject();
        } else {
          resolve(rule);
        }
      }
    });
  },

  environment(rule, message, global) {
    var environment = global != null && global.environment === 'production' ? 'production' : 'development';
    return new Promise(function(resolve, reject) {
      if (environment === rule.environment) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  inbound(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.inbound === true) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  anyCommand(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && _.isString(message.payload.content) && helpers.isCommand(message.payload.content)) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  command(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && helpers.isCommand(message.payload.content, rule.command)) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  outbound(rule, message) {
    return new Promise(function(resolve, reject) {
      if (message.payload != null && message.payload.inbound === false) {
        resolve(rule);
      } else {
        reject();
      }
    });
  },

  isTopicEmpty(rule, message) {
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

  catchAll(rule) {
    return new Promise(function (resolve) {
      resolve(rule);
    });
  },

  isNotTopic(rule, message) {
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

  isTopic(rule, message) {
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

  hasNotVariable(rule, message) {
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

  hasVariable(rule, message) {
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
  },

  topicIncludes(rule, message) {
    return new Promise(function (resolve, reject) {
      var chatContext = message.chat();
      when(chatContext.get('topic'))
        .then(
          function (topic) {
            if (topic.indexOf(rule.topic) !== -1 ) {
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
 * @param {Object} RED
 * @param {Number} [current=1]
 */
function executeRules(rules, message, global, current) {

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
    Types[first.type](first, message, global)
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
            executeRules(nextRules, message, global, current + 1)
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
  const registerType = RegisterType(RED);

  function ChatBotRules(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var global = this.context().global;
    node.rules = config.rules;

    this.on('input', function(msg) {
      var rules = utils.extractValue('arrayOfObject', 'rules', node, msg, true);
      executeRules(rules, msg, global)
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

  registerType('chatbot-rules', ChatBotRules);
};
