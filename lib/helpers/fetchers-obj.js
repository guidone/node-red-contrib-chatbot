const fs = require('fs');
const mime = require('mime');
const Path = require('path');

const fetchers = {

  identity(value) {
    return new Promise(resolve => {
      resolve({ buffer: value });
    });
  },

  async url(url) {
    let response;
    try {
      response = await fetch(url);
    } catch (e) {
      throw `Error downloading file ${url}`;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    return {
      buffer,
      filename: Path.basename(url),
      extension: Path.extname(url),
      mimeType: response.headers.get('content-type'),
      size: buffer.length
    };
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
