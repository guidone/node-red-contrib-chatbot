var request = require('request').defaults({ encoding: null });
var _ = require('underscore');
var os = require('os');
var fs = require('fs');

// local vars, store temporary profiles
var _profiles = {};

module.exports = {

  getOrFetchProfile: function(facebookId, bot) {
    return new Promise(function(resolve, reject) {
      if (_profiles[facebookId] != null) {
        resolve(_profiles[facebookId]);
      } else {
        // ask facebook
        bot.getProfile(facebookId, function(err, profile) {
          if (err) {
            reject('Unable to get profile info for ' + facebookId);
          } else {
            resolve(profile);
          }
        });
      }
    });
  },

  downloadFile: function(url, token) {
    return new Promise(function(resolve, reject) {
      var options = {
        url: url
      };
      request(options, function(error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  },

  uploadBuffer: function(params) {

    return new Promise(function(resolve, reject) {
      params = _.extend({
        recipient: null,
        filename: 'tmp-file',
        token: null,
        buffer: null,
        type: 'image'
      }, params);

      var tmpFile = os.tmpdir() + '/' + params.filename;
      // write to filesystem to use stream
      fs.writeFile(tmpFile, params.buffer, function(err) {
        if (err) {
          reject(err);
        } else {
          // upload and send
          var formData = {
            recipient: '{"id":"' + params.recipient +'"}',
            message: '{"attachment":{"type":"' + params.type + '", "payload":{}}}',
            filedata: fs.createReadStream(tmpFile)
          };
          request.post({
            url: 'https://graph.facebook.com/v2.6/me/messages?access_token=' + params.token,
            formData: formData
          }, function(err) {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        }
      }); // end writeFile
    });
  }

};
