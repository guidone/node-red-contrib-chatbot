var _ = require('underscore');
var moment = require('moment');
var fs = require('fs');

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
            //logString = msg.payload.content.replace(/\n/g, '');
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
          default:
            logString = msg.payload.content instanceof Buffer ? '<buffer>' : String(msg.payload.content);
        }
      }

      return logString;
    },

    message: function(msg) {

      var chatId = variables.chatId;
      var inbound = msg.payload != null && msg.payload.inbound === true;
      var firstName = variables.firstName;
      var lastName = variables.lastName;
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
            + moment().toString() + ' - ' + stringifiedMessage;
        }
      }

      return logString;
    }
  };

  return self;
};
