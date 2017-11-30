var request = require('request').defaults({ encoding: null });
var _ = require('underscore');
var os = require('os');
var fs = require('fs');

// local vars, store temporary profiles
var _profiles = {};

module.exports = {

  parseButtons: function(buttons) {
    return _(buttons).chain()
      .map(function(button) {
        var temp = null;
        switch(button.type) {
          case 'url':
            temp = {
              type: 'web_url',
              title: button.label,
              url: button.url
            };
            if (button.webViewHeightRatio != null) {
              temp.webview_height_ratio = button.webViewHeightRatio;
            }
            if (button.extensions != null) {
              temp.messenger_extensions = button.extensions;
            }
            return temp;
          case 'call':
            return {
              type: 'phone_number',
              title: button.label,
              payload: button.number
            };
          case 'postback':
            return {
              type: 'postback',
              title: button.label,
              payload: button.value
            };
          case 'share':
            return {
              type: 'element_share'
            };
          case 'login':
            return {
              type: 'account_link',
              url: button.url
            };
          case 'logout':
            return {
              type: 'account_unlink'
            };
          case 'quick-reply':
            temp = {
              content_type: 'text',
              title: button.label,
              payload: !_.isEmpty(button.value) ? button.value : button.label
            };
            if (!_.isEmpty(button.url)) {
              temp.image_url = button.url;
            }
            return temp;
          case 'location':
            return {
              content_type: 'location'
            };
          default:
            // eslint-disable-next-line no-console
            console.log('Facebook Messenger was not able to use button of type "' + button.type + '"');
            return null;
        }
      })
      .compact()
      .value();
  },

  getOrFetchProfile: function(facebookId, bot) {
    return new Promise(function(resolve, reject) {
      // if id is null, then spit out a test user
      if (facebookId == null) {
        resolve({
          first_name: 'Test user first name',
          last_name: 'Test user last name'
        });
        return;
      }
      if (_profiles[facebookId] != null) {
        resolve(_profiles[facebookId]);
      } else {
        // ask facebook
        bot.getProfile(facebookId)
          .then(function(profile) {
            _profiles[facebookId] = profile;
            resolve(profile);
          })
          .catch(function(err) {
            reject('Unable to get profile info for ' + facebookId + (err.message != null ? ' - ' + err.message : ''));
          });
      }
    });
  },

  downloadFile: function(url) {
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
        type: 'image',
        mimeType: 'application/octet-stream'
      }, params);

      var tmpFile = os.tmpdir() + '/' + params.filename;

      // write to filesystem to use stream
      fs.writeFile(tmpFile, params.buffer, function(err) {
        if (err) {
          reject(err);
        } else {
          // prepare payload
          var filedata = null;
          switch(params.type) {
            case 'image':
              filedata = {
                value: fs.createReadStream(tmpFile),
                options: {
                  filename: params.filename,
                  contentType: 'image/png' // fix extension
                }
              };
              break;
            case 'audio':
              filedata = {
                value: fs.createReadStream(tmpFile),
                options: {
                  filename: params.filename,
                  contentType: 'audio/mp3'
                }
              };
              break;
            case 'video':
              filedata = {
                value: fs.createReadStream(tmpFile),
                options: {
                  filename: params.filename,
                  contentType: params.mimeType
                }
              };
              break;
            case 'file':
              filedata = {
                value: fs.createReadStream(tmpFile),
                options: {
                  filename: params.filename,
                  contentType: params.mimeType
                }
              };
          }
          // upload and send
          var formData = {
            recipient: '{"id":"' + params.recipient +'"}',
            message: '{"attachment":{"type":"' + params.type + '", "payload":{}}}',
            filedata: filedata
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
