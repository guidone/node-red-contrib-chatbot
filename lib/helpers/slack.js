var request = require('request').defaults({ encoding: null });

module.exports = {

  downloadFile: function(url, token) {
    return new Promise(function(resolve, reject) {
      var options = {
        url: url,
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };
      request(options, function(error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }

};
