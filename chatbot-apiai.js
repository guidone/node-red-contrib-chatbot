var _ = require('underscore');
var apiai = require('apiai');
var moment = require('moment');
var utils = require('./lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotApiAi(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.rules = config.rules;
    node.apiAiNodeId = config.apiai;

    this.processMessage = function(msg) {
      msg = RED.util.cloneMessage(msg);
      var context = node.context();
      var originalMessage = msg.originalMessage;
      var chatId = msg.payload.chatId || (originalMessage && originalMessage.chat.id);
      var chatContext = context.global.get('chat:' + chatId);
      var rules = node.rules;
      var outputsNumber = (_.isArray(rules) ? rules.length : 0) + 1;
      var output = null;
      var apiAiNode = RED.nodes.getNode(node.apiAiNodeId);
      var apiAi = apiAiNode.apiAi;

      // check for string
      var message = null;
      if (_.isString(msg.payload)) {
        message = msg.payload;
      } else if (msg.payload != null && _.isString(msg.payload.content)) {
        message = msg.payload.content;
      } else {
        node.error('A payload of string or chat text message is required as input');
        return;
      }

      var outboundContexts = chatContext.get('topic');
      if (!_.isEmpty(outboundContexts)) {
        outboundContexts = _.isArray(outboundContexts) ? outboundContexts : [outboundContexts];
      }

      // prepare request
      apiAi.textRequest(message, {
        sessionId: chatId,
        contexts: outboundContexts
        // todo put timezone
        // todo put language
      }).on('response', function(response) {

        var result = response.result;
        // parse result
        if (result.actionIncomplete || result.action === 'input.unknown') {
          // if action incomplete, start over from here next message, do nothing with context
          // the same if the action is unknow, just spit out the message and start from here
          chatContext.set('currentConversationNode', node.id);
          chatContext.set('currentConversationNode_at', moment());
          // exit only from the first output
          msg.payload = response.result.fulfillment.speech;
          output = new Array(outputsNumber);
          output[0] = msg;
        } else {
          // get the output contexts, support multi context but try to reduce as a string if possible and
          // put the context back in the variables namespace
          var contexts = _(response.result.contexts).pluck('name');
          var inboundContexts = contexts;
          if (_.isEmpty(contexts)) {
            inboundContexts = null;
          } else if (contexts.length === 1) {
            inboundContexts = contexts[0];
          }
          chatContext.set('topic', inboundContexts);
          // set the parameters back to the chat context
          chatContext.set(result.parameters);
          // prepare output, only if it matches the context
          msg.payload = response.result.fulfillment.speech;
          output = new Array();
          output.push(null);
          rules.forEach(function(rule) {
            output.push(utils.matchContext(inboundContexts, rule.topic) ? msg : null);
          });
        }
        // finally send
        node.send(output);
      }).on('error', function(error) {
        node.error(error);
      }).end();

    };

    // relay message
    var handler = function(msg) {
      node.processMessage(msg);
    };
    RED.events.on('node:' + config.id, handler);

    // cleanup on close
    this.on('close',function() {
      RED.events.removeListener('node:' + config.id, handler);
    });

    this.on('input', this.processMessage);
  }

  RED.nodes.registerType('chatbot-apiai', ChatBotApiAi);
  
  function ApiAiToken(n) {
    RED.nodes.createNode(this, n);
    var self = this;
    if (self.credentials != null && !_.isEmpty(self.credentials.token)) {
      self.apiAi = apiai(self.credentials.token);
    }
  }

  RED.nodes.registerType('chatbot-apiai-token', ApiAiToken, {
    credentials: {
      token: {
        type: 'text'
      }
    }
  });

};
