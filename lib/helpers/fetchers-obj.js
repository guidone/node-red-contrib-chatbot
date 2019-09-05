const request = require('request').defaults({ encoding: null });
const fs = require('fs');
const mime = require('mime');
const Path = require('path');

const fetchers = {

  identity(value) {
    return new Promise(function(resolve) {
      resolve({
        buffer: value instanceof Buffer ? value : null
      });
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

  file(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, (error, buffer) => {
        if (error == null) {
          resolve({
            filename: Path.basename(path),
            extension: Path.extname(path),
            mimeType: mime.lookup(path),
            buffer
          });
        } else {
          reject(`Error opening file ${path}`);
        }
      });
    });
  }

};

module.exports = fetchers;
