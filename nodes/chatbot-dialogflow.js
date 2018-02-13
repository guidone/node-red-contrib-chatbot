var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var request = require('request').defaults({ encoding: null });
var clc = require('cli-color');
var moment = require('moment');

const dialogflow = require('dialogflow');


var when = utils.when;
var warn = clc.yellow;

module.exports = function(RED) {

  function ChatBotDialogflow(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.dialogflow = config.dialogflow;
    node.language = config.language;

    this.on('input', function (msg) {

      var chatContext = msg.chat();
      var dialogFlowNode = RED.nodes.getNode(node.dialogflow);
      var language = utils.extractValue('string', 'language', node, msg, false);

      //console.log('dialogFlowNode', dialogFlowNode);
      // exit if empty credentials
      /*if (recastNode == null || recastNode.credentials == null || _.isEmpty(recastNode.credentials.token)) {
        warn('Recast.ai token is missing.');
        return;
      }*/

      var chatId = utils.getChatId(msg);
      //var sessionPath = sessionClient.sessionPath('guidone', chatId);
      // exit if not message
      if (!utils.message.isMessage(msg)) {
        node.send([null, msg]);
        return;
      }

      var requestUrl = 'https://api.dialogflow.com/v1/query?'
        + 'v=20170712'
        + '&query=' + encodeURIComponent(msg.payload.content)
        + '&lang=en'
        + '&resetContexts=true'
        + '&sessionId=' + chatId
        + '&timezone=CET';

      request({
        method: 'GET',
        url: requestUrl,
        json: true,
        headers: {
          'Authorization': 'Bearer ' + dialogFlowNode.credentials.token
        }
      }, function(error, response, body) {

        if (error) {
          node.error(error);
        } else {

          if (body.result != null && body.result.metadata != null && body.result.metadata.intentName != null) {
            // test if no match
            if (body.result.action === 'input.unknown') {
              // if didn't matched any intent
              node.send([null, msg]);
            } else {
              var intent = body.result.metadata.intentName;
              var variables = body.result.parameters;

              // remove empty vars
              _(variables).each(function(value, key) {
                if (_.isEmpty(value)) {
                  delete variables[key];
                }
              });

              console.log('++++ intent', intent);
              console.log('++++ variables', variables);

              when(chatContext.set('topic', intent))
                .then(
                  function() {
                    msg.payload = {
                      intent: intent,
                      variables: variables
                    };
                    node.send([msg, null]);
                  },
                  function(error) {
                    node.error(error);
                  }
                );
            }
          } else {
            node.error(error);
          }
        }
      });
    });
  }

  RED.nodes.registerType('chatbot-dialogflow', ChatBotDialogflow);

  function DialogflowToken(n) {
    RED.nodes.createNode(this, n);
  }

  RED.nodes.registerType('chatbot-dialogflow-token', DialogflowToken, {
    credentials: {
      token: {
        type: 'text'
      }
    }
  });

};
