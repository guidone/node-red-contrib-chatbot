var request = require('request').defaults({ encoding: null });

module.exports = {

  downloadFile: function(url) {
    return new Promise(function(resolve, reject) {
      var options = {
        url: url
      };
      request(options, function(error, response, body) {
        if (error) {
          reject('Unable to download file ' + url);
        } else {
          resolve(body);
        }
      });
    });
  }

};
