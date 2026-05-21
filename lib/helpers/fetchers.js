var fs = require('fs');


var fetchers = {

  identity: function(value) {
    return new Promise(function(resolve) {
      resolve(value);
    });
  },

  url: function(url) {
    return fetch(url)
      .then(function(response) {
        return response.arrayBuffer();
      })
      .then(function(buffer) {
        return Buffer.from(buffer);
      })
      .catch(function() {
        return Promise.reject('Error downloading file ' + url);
      });
  },

  file: function(path) {
    return new Promise(function(resolve, reject) {
      fs.readFile(path, function(error, data) {
        if (error == null) {
          resolve(data);
        } else {
          reject('Error opening file ' + path);
        }
      });
    });
  }

};

module.exports = fetchers;
