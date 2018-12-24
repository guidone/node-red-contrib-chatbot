var _ = require('underscore');
var moment = require('moment');
var fs = require('fs');
var lcd = require('./helpers/lcd');

module.exports = function(variables) {

  var self = {

    log: function(msg, fileName) {
      return new Promise(function(resolve) {
        if (_.isEmpty(fileName)) {
          // resolve immediately if empty and do nothing
          resolve(msg);
        } else {
          fs.appendFile(fileName, self.message(msg) + '\n', function (err) {
            if (err) {
              // eslint-disable-next-line no-console
              console.error(err);
            }
            // resolve anyway, problem on logging should not stop the chatbot
            resolve(msg);
          });
        }
      });
    },

    toString: function(msg) {

      var logString = null;

      if (_.isObject(msg.payload)) {

        switch (msg.payload.type) {
          case 'message':
            logString = msg.payload.content;
            break;
          case 'location':
            logString = 'latitude: ' + msg.payload.content.latitude + ' longitude: ' + msg.payload.content.latitude;
            break;
          case 'photo':
            logString = 'image: ' + (msg.payload.filename != null ? msg.payload.filename : '<buffer>');
            break;
          case 'video':
            logString = 'video: ' + (msg.payload.filename != null ? msg.payload.filename : '<buffer>');
            break;
          case 'document':
            logString = 'document: ' + (msg.payload.filename != null ? msg.payload.filename : '<buffer>');
            break;
          case 'audio':
            logString = 'audio: ' + (msg.payload.filename != null ? msg.payload.filename : '<buffer>');
            break;
          case 'inline-buttons':
            logString = msg.payload.content + ' ' + msg.payload.buttons.map(function (button) {
                return '[' + button.label + ']';
              }).join(' ');
            break;
          case 'intent':
            logString = 'intent: ' + msg.payload.intent + ' vars: ' + JSON.stringify(msg.payload.variables);
            break;
          case 'event':
            logString = 'event: ' + msg.payload.eventType;
            break;
          case 'speech':
            logString = 'speech: '
              + (!_.isEmpty(msg.payload.text) ? msg.payload.text : '')
              + (!_.isEmpty(msg.payload.ssml) ? msg.payload.ssml : '');
            break;
          case 'directive':
            logString = 'directive: ' +  msg.payload.directiveType;
            break;
          default:
            // eslint-disable-next-line no-console
            console.log(lcd.warn('Un-handled message type ' + msg.payload.type + ' in logs'));
            logString = msg.payload.content instanceof Buffer ? '<buffer>' : String(msg.payload.content);
        }
      }

      return logString;
    },

    message: function(msg) {

      var chatId = variables.chatId || msg.originalMessage.chatId || msg.payload.chatId;
      var inbound = msg.payload != null && msg.payload.inbound === true;
      var firstName = variables.firstName;
      var lastName = variables.lastName;
      var transport = msg.originalMessage != null ? msg.originalMessage.transport : null;
      var logString = null;

      var name = [];
      if (firstName != null) {
        name.push(firstName);
      }
      if (lastName != null) {
        name.push(lastName);
      }

      if (_.isObject(msg.payload)) {
        var stringifiedMessage = this.toString(msg);
        if (!_.isEmpty(stringifiedMessage)) {
          logString = chatId + ' '
            + (!_.isEmpty(name) ? '[' + name.join(' ') + '] ' : '')
            + (inbound ? '> ' : '< ')
            + (transport != null ? '[' + transport.toUpperCase() + '] ' : '')
            + moment().toString() + ' - ' + stringifiedMessage;
        }
      }

      return logString;
    }
  };

  return self;
};
