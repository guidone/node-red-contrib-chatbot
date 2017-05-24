var _ = require('underscore');
var request = require('request').defaults({ encoding: null });
//var token = 'U5iDWa2uRAAdaE2e6i0xxuWQgT82UF5D7Bsmy8nJ';

module.exports = function(options) {

  options = _.extend({
    token: null
  }, options);

  var token = options.token;

  return {
    inbound: function(msg) {
      return new Promise(function(resolve, reject) {
        var context = msg.payload.content;
        request.post({
          url: 'https://tracker.dashbot.io/track?platform=generic&v=0.8.2-rest&type=incoming&apiKey=' + token,
          json: {
            'text': context,
            'userId': String(msg.payload.chatId)
          }
        }, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(msg);
          }
        });
      });
    },
    outbound: function(msg) {
      return new Promise(function(resolve, reject) {
        var context = msg.payload.content;
        request.post({
          url: 'https://tracker.dashbot.io/track?platform=generic&v=0.8.2-rest&type=outgoing&apiKey=' + token,
          json: {
            'text': context,
            'userId': String(msg.payload.chatId)
          }
        }, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(msg);
          }
        });
      });
    }
  };
};
