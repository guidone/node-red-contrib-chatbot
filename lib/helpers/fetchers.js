var request = require('request').defaults({ encoding: null });
//var _ = require('underscore');
var fs = require('fs');


var fetchers = {

  identity: function(value) {
    return new Promise(function(resolve) {
      resolve(value);
    });
  },

  url: function(url) {
    return new Promise(function(resolve, reject) {
      var options = {
        url: url
      };
      request(options, function(error, response, body) {
        if (error) {
          reject('Error downloading file ' + url);
        } else {
          resolve(body);
        }
      });
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
