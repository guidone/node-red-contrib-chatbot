var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var lcd = require('../lib/helpers/lcd');
var dialogflow = require('dialogflow');


var when = utils.when;

module.exports = function(RED) {

  function ChatBotDialogflow(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    node.dialogflow = config.dialogflow;
    node.language = config.language;
    node.debug = config.debug;
    node.variable = config.variable;

    this.on('input', function (msg) {

      var chatContext = msg.chat();
      var dialogFlowNode = RED.nodes.getNode(node.dialogflow);
      var language = utils.extractValue('string', 'language', node, msg, false);
      var variable = utils.extractValue('string', 'variable', node, msg, false);
      var debug = utils.extractValue('boolean', 'debug', node, msg, false);
      var chatId = utils.getChatId(msg);


      // exit if empty credentials
      if (dialogFlowNode == null || dialogFlowNode.credentials == null) {
        lcd.warn('Dialogflow.ai credentials are missing.');
        return;
      }
      // error if no language at all
      if (_.isEmpty(language)) {
        node.error('Language param is empty in Dialogflow node');
        return;
      }

      // exit if not message
      if (!utils.message.isMessage(msg)) {
        node.send([null, msg]);
        return;
      }

      var email = dialogFlowNode.credentials.email;
      var privateKey = dialogFlowNode.credentials.privateKey;
      var projectId = dialogFlowNode.credentials.projectId;



      var sessionClient = new dialogflow.SessionsClient({
        credentials: {
          //private_key: private_key,
          //client_email: 'dialogflow-mdnmfu@guidone-6ce99.iam.gserviceaccount.com'
          private_key: privateKey,
          client_email: email
        }
      });

      /*
      POST https://language.googleapis.com/v1/documents:analyzeEntities?key=API_KEY
      */

      console.log('projectid', projectId);
      console.log('chatId', chatId);
      var sessionPath = sessionClient.sessionPath(projectId, String(chatId));

      var request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: msg.payload.content,
            languageCode: language.toLowerCase()
          }
        }
      };









      /*sessionClient
        .detectIntent(request)
        .then(function(responses) {

          console.log('RESP', responses[0].queryResult.intent);
          console.log('RESP', responses[0].queryResult.parameters);


        })
        .catch(function(error) {
          console.log('sbaglio', error);
        })*/


      var intent = null;
      var variables = null;
      var answer = null;
      var body = null;

      when(chatContext.set('pending', true))
        .then(function() {
          return sessionClient.detectIntent(request);
        })
        /*.then(function() {
          return utils.request(dialogFlow);
        })*/
        .then(function(response) {
          body = response;
          return when(chatContext.set('pending', false));
        })
        .then(function() {

          console.log('RESP', body[0].queryResult.intent);
          console.log('RESP', body[0].queryResult.parameters);

          /*if (body != null && body.result != null && body.result.metadata != null && body.result.metadata.intentName != null) {
            // test if no match
            if (body.result.action === 'input.unknown') {
              if (debug) {
                lcd.node(body.result.action, {node: node, title: 'Dialogflow.ai'});
              }
              // if didn't matched any intent
              node.send([null, msg]);
              return Promise.reject();
            } else {
              intent = body.result.metadata.intentName;
              variables = body.result.parameters;
              answer = body.result.fulfillment != null ? body.result.fulfillment.speech : null;
              // remove empty vars
              _(variables).each(function(value, key) {
                if (value == null) {
                  delete variables[key];
                }
              });
              return when(!_.isEmpty(variable) ? chatContext.set(variable, intent) : true);
            }
          } else {
            return Promise.reject('Error on api.dialogflow.com');
          }*/


        })
        .then(function() {
          msg.payload = {
            intent: intent,
            variables: variables,
            answer: answer
          };
          if (debug) {
            lcd.node(msg.payload, { node: node, title: 'Dialogflow.com' });
          }
          node.send([msg, null]);
        })
        .catch(function(error) {
          if (error != null) {
            node.error(error, msg);
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
      email: {
        type: 'text'
      },
      privateKey: {
        type: 'text'
      },
      projectId: {
        type: 'text'
      }
    }
  });

};
