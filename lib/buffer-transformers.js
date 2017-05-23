var _ = require('underscore');
var JSZip = require('jszip');

module.exports = {

  identity: function(file) {
    return new Promise(function(resolve) {
      resolve(file);
    });
  },

  zip: function(file) {
    return new Promise(function(resolve) {
      var zip = new JSZip();
      zip.file(file.filename, file.buffer);
      zip.generateAsync({type: 'nodebuffer'})
        .then(function(zippedBuffer) {
          var newFile = _.extend({}, file, {
            buffer: zippedBuffer,
            filename: file.filename.substr(0, file.filename.lastIndexOf('.')) + '.zip',
            extension: '.zip',
            mimeType: 'application/zip'
          });
          resolve(newFile);
        });
    });
  }


};
