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
          private_key: privateKey,
          client_email: email
        }
      });

      /*
      POST https://language.googleapis.com/v1/documents:analyzeEntities?key=API_KEY
      */
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

      var isFallback = null;
      var intent = null;
      var variables = {};
      var answer = null;
      var body = null;

      when(chatContext.set('pending', true))
        .then(function() {
          return sessionClient.detectIntent(request);
        })
        .then(function(response) {
          body = response;
          return when(chatContext.set('pending', false));
        })
        .then(function() {
          // extract variables
          if (body == null || !_.isArray(body) || _.isEmpty(body)) {
            return Promise.reject('Error on api.dialogflow.com');
          }
          // parse answer
          intent = body[0].queryResult.intent != null && body[0].queryResult.intent.displayName ?
            body[0].queryResult.intent.displayName : null;
          isFallback = body[0].queryResult.intent != null && body[0].queryResult.intent.isFallback ?
            body[0].queryResult.intent.isFallback : null;
          answer = !_.isEmpty(body[0].queryResult.fulfillmentText) ? body[0].queryResult.fulfillmentText : null;
          // get fields
          if (body[0].queryResult.parameters != null && body[0].queryResult.parameters.fields) {
            _(body[0].queryResult.parameters.fields).each(function(value, key) {
              variables[key] = value.stringValue;
            });
          }
          // if empty, exit from second output and stop here
          if (intent == null) {
            // if didn't matched any intent
            node.send([null, msg]);
            return Promise.reject();
          } else {
            // if found, store the intent in the context and go on
            return when(!_.isEmpty(variable) ? chatContext.set(variable, intent) : true);
          }
        })
        .then(function() {
          msg.payload = {
            isFallback: isFallback,
            intent: intent,
            variables: !_.isEmpty(variables) ? variables : null,
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
