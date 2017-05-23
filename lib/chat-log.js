var _ = require('underscore');
var moment = require('moment');
var fs = require('fs');

module.exports = function(chatContext) {

  var self = {

    log: function(msg, fileName) {
      return new Promise(function(resolve) {
        if (chatContext == null || _.isEmpty(fileName)) {
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

    message: function(msg) {

      var chatId = chatContext.get('chatId');
      var inbound = msg.payload != null && msg.payload.inbound === true;
      var firstName = chatContext.get('firstName');
      var lastName = chatContext.get('lastName');
      var logString = null;

      var name = [];
      if (firstName != null) {
        name.push(firstName);
      }
      if (lastName != null) {
        name.push(lastName);
      }

      if (_.isObject(msg.payload)) {

        switch(msg.payload.type) {
          case 'message':
            logString = msg.payload.content.replace(/\n/g, '');
            break;
          case 'location':
            logString = 'latitude: ' + msg.payload.content.latitude + ' longitude: ' + msg.payload.content.latitude;
            break;
          case 'photo':
            logString = 'image: ' + (msg.payload.filename != null ? msg.payload.filename : '<buffer>');
            break;
          case 'audio':
            logString = 'audio: ' + (msg.payload.filename != null ? msg.payload.filename : '<buffer>');
            break;
          default:
            var content = msg.payload.content instanceof Buffer ? '<buffer>' : String(msg.payload.content);
            logString = content.replace(/\n/g, '');
        }
        logString = chatId + ' '
            + (!_.isEmpty(name) ? '[' + name.join(' ') + '] ' : '')
            + (inbound ? '> ' : '< ')
            + moment().toString() + ' - ' + logString;
      }

      return logString;
    }
  };

  return self;
};
