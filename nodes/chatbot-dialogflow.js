const _ = require('underscore');
const utils = require('../lib/helpers/utils');
const lcd = require('../lib/helpers/lcd');
const dialogflow = require('dialogflow');
const when = utils.when;
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

function parseValue(value) {
  if (value.kind === 'stringValue') {
    if (!_.isEmpty(value.stringValue)) {
      return value.stringValue;
    }
  } else if (value.kind === 'numberValue') {
    return value.numberValue;
  } else if (value.kind === 'structValue' ) {
    return parseFields(value.structValue.fields);
  } else if (value.kind === 'listValue') {
    return value.listValue.values.map(parseValue);
  } else {
    // eslint-disable-next-line no-console
    console.log('Warning: incorrectly handled dialogflow.com response type:');
    // eslint-disable-next-line no-console
    console.log(value);
  }
}

function parseFields(fields) {
  var variables = {};

  _(fields).each(function(value, key) {
    variables[key] = parseValue(value);
  });

  return variables;
}


module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotDialogflow(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    globalContextHelper.init(this.context().global);
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
          if (body[0].queryResult.intent != null && body[0].queryResult.intent.displayName) {
            intent = body[0].queryResult.intent.displayName;
          } else if (!_.isEmpty(body[0].queryResult.action) && body[0].queryResult.action.indexOf('smalltalk.') !== -1) {
            intent = body[0].queryResult.action;
          }
          isFallback = body[0].queryResult.intent != null && body[0].queryResult.intent.isFallback ?
            body[0].queryResult.intent.isFallback : null;
          answer = !_.isEmpty(body[0].queryResult.fulfillmentText) ? body[0].queryResult.fulfillmentText : null;
          // get fields
          if (body[0].queryResult.parameters != null && body[0].queryResult.parameters.fields) {
            variables = parseFields(body[0].queryResult.parameters.fields);
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
            type: 'intent',
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

  registerType('chatbot-dialogflow', ChatBotDialogflow);

  function DialogflowToken(n) {
    RED.nodes.createNode(this, n);
    globalContextHelper.init(this.context().global);
  }

  registerType('chatbot-dialogflow-token', DialogflowToken, {
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
