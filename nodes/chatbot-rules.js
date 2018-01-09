var utils = require('../lib/helpers/utils');
var _ = require('underscore');
var when = utils.when;

var Types = {
  is_topic_empty: function(rule, chatContext) {
    return new Promise(function(resolve, reject) {
      when(chatContext.get('topic'))
        .then(
          function(topic) {
            console.log('il topic???', topic);
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

  is_not_topic: function(rule, chatContext) {
    return new Promise(function (resolve, reject) {
      when(chatContext.get('topic'))
        .then(
          function (topic) {
            console.log('diverso il topic da ' + rule.topic);
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

  has_not_variable: function(rule, chatContext) {
    return new Promise(function (resolve, reject) {
      when(chatContext.get(rule.name))
        .then(
          function (content) {
            console.log('empty la var ' + rule.name);
            if (_.isEmpty(content)) {
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

};


function executeRules(rules, chatContext, current) {

  current = current || 1;

  if (_.isEmpty(rules)) {
    return new Promise(function(resolve, reject) {
      reject();
    });
  } else {
    var first = _(rules).first();
    console.log('Analizzo', current, first);
    return new Promise(function(resolve, reject) {

      if (!_.isFunction(Types[first.type])) {
        console.log('Error: no function for type ' + first.type);
        reject();
      }

      Types[first.type](first, chatContext)
        .then(
          function () {
            console.log('ok la prima');
            first.index = current;
            resolve(first);
          },
          function () {
            var nextRules = _.rest(rules);
            if (_.isEmpty(nextRules)) {
              reject();
            } else {
              console.log('rieseguo ', current + 1);
              executeRules(nextRules, chatContext, current + 1)
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


  /*return new Promise(function(resolve, reject) {




  })*/


}




module.exports = function(RED) {

  function ChatBotRules(config) {
    RED.nodes.createNode(this, config);
    var node = this;

    node.rules = config.rules;

    this.on('input', function(msg) {

      var originalMessage = msg.originalMessage;
      var chatContext = msg.chat();

      var rules = node.rules;


      rules = [
        {
          type: 'is_topic_empty'
        },
        {
          type: 'is_not_topic',
          topic: 'query'
        },
        {
          type: 'has_not_variable',
          name: 'room'
        },
        {
          type: 'has_not_variable',
          name: 'date'
        },
        {
          type: 'set_topic',
          topic: 'selected'
        }

      ];


      executeRules(rules, chatContext)
        .then(
          function(rule) {
            console.log('OK rules -> ', rule);
            var result = new Array(rules.length);
            result[rule.index - 1] = msg;
            node.send(result);
          },
          function() {
            console.log('failed');
          }
        );




    });
  }

  RED.nodes.registerType('chatbot-rules', ChatBotRules);
};
