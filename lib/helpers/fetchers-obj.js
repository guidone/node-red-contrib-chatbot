const request = require('request').defaults({ encoding: null });
const fs = require('fs');
const mime = require('mime');
const Path = require('path');

const fetchers = {

  identity(value) {
    return new Promise(resolve => {
      resolve({ buffer: value });
    });
  },

  url(url) {
    return new Promise(function(resolve, reject) {
      const options = {
        url: url
      };
      request(options, (error, response, buffer) => {
        if (error) {
          reject(`Error downloading file ${url}`);
        } else {
          resolve({
            buffer,
            filename: Path.basename(url),
            extension: Path.extname(url),
            mimeType: response.headers['content-type'],
            size: buffer.length
          });
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
            buffer,
            size: buffer.length
          });
        } else {
          reject(`Error opening file ${path}`);
        }
      });
    });
  }

};

module.exports = fetchers;
