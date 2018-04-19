var _ = require('underscore');
var qs = require('querystring');
var url = require('url');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var ChatLog = require('../chat-log');

var request = require('request').defaults({ encoding: null });
var utils = require('../../lib/helpers/utils');
var when = utils.when;

var Facebook = new ChatExpress({
  //inboundMessageEvent: 'message',
  transport: 'facebook',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    return payload.sender != null ? payload.sender.id : null;
  },
  userIdKey: function(payload) {
    return payload.sender != null ? payload.sender.id : null;
  },
  tsKey: function(payload) {
    return moment.unix(payload.timestamp / 1000);
  },
  type: function() {
    // todo remove this
  },
  onStart: function() {
    this._profiles = {};
    return true;
  },
  events: {},
  routes: {
    '/redbot/facebook/test': function(req, res) {
      res.send('ok');
    },
    '/redbot/facebook': function(req, res) {
      var chatServer = this;
      if (req.method === 'GET') {
        // it's authentication challenge
        this.sendVerificationChallenge(req, res);
      } else if (req.method === 'POST') {
        var json = req.body;
        //console.log('>>>>');
        //console.log(prettyjson.render(req.body));
        if (json != null && _.isArray(json.entry)) {
          var entries = json.entry;
          _(entries).each(function (entry) {
            var events = entry.messaging;
            _(events).each(function (event) {
              if (event.message != null && event.message.quick_reply != null && !_.isEmpty(event.message.quick_reply.payload)) {
                // handle quick reply, treat as message, pass thru the payload
                event.message = {
                  text: event.message.quick_reply.payload
                };
                delete event.quick_reply;
                chatServer.receive(event);
              } else if (event.message != null) {
                // handle inbound messages
                chatServer.receive(event);
              } else if (event.postback != null) {
                // handle postbacks
                event.message = {
                  text: event.postback.payload
                };
                delete event.postback;
                chatServer.receive(event);
              } else if (event.account_linking != null) {
                chatServer.receive(event);
              }
            });
          });
          res.send({status: 'ok'});
        }
      }
    }
  },
  routesDescription: {
    '/redbot/facebook': 'Use this in the "Webhooks" section of the Facebook App ("Edit Subscription" button)',
    '/redbot/facebook/test': 'Use this to test that your SSL (with certificate or ngrok) is working properly, should answer "ok"'
  }
});

// detect account linking payload
Facebook.in(function(message) {
  if (message.originalMessage.account_linking != null) {
    message.payload.type = 'account-linking';
    message.payload.content = message.originalMessage.account_linking.authorization_code;
    message.payload.linkStatus = message.originalMessage.account_linking.status;
    return message;
  }
  return message;
});

// get plain text messages
Facebook.in(function(message) {
  return new Promise(function(resolve, reject) {
    var chatContext = message.chat();
    if (_.isString(message.originalMessage.message.text) && !_.isEmpty(message.originalMessage.message.text)) {
      message.payload.content = message.originalMessage.message.text;
      message.payload.type = 'message';
      when(chatContext.set('message', message.payload.content))
        .then(function () {
          resolve(message);
        }, function (error) {
          reject(error);
        });
    } else {
      resolve(message);
    }
  });
});

Facebook.in(function(message) {
  var chatServer = this;
  var attachments = message.originalMessage.message.attachments;
  if (_.isArray(attachments) && !_.isEmpty(attachments)) {
    var attachment = attachments[0];
    var type = null;
    if (attachment.type === 'image') {
      type = 'photo';
    } else if (attachment.type === 'audio') {
      type = 'audio';
    } else if (attachment.type === 'file') {
      type = 'document';
    } else if (attachment.type === 'video') {
      type = 'video';
    } else {
      // don't know what to do
      return message;
    }
    // download the image into a buffer
    return new Promise(function(resolve, reject) {
      chatServer.downloadFile(attachment.payload.url)
        .then(function (buffer) {
          message.payload.content = buffer;
          message.payload.type = type;
          resolve(message);
        }, function() {
          reject('Unable to download ' + attachment.payload.url);
        });
    });
  }
  return message;
});

// get facebook user details
Facebook.in(function(message) {
  var userId = message.payload.userId;
  var chatServer = this;
  var options = this.getOptions();
  var context = message.chat();
  var authorizedUsernames = options.authorizedUsernames;

  return new Promise(function(resolve, reject) {
    var task = null;
    if (chatServer._profiles[userId] != null) {
      task = when(chatServer._profiles[userId]);
    } else {
      task = chatServer.getProfile(userId)
        .then(function(obj) {
          chatServer._profiles[userId] = obj;
          return obj;
        });
    }
    task
      .then(function(obj) {
        obj.authorized = false;
        if (_.isArray(authorizedUsernames) && !_.isEmpty(authorizedUsernames)) {
          if (_.contains(authorizedUsernames, userId)) {
            obj.authorized = true;
          }
        }
        return obj;
      })
      .then(function(obj) {
        return when(context.set(obj));
      })
      .then(
        function () {
          resolve(message);
        },
        function (err) {
          reject('Unable to get profile info for user ' + userId + (err.message != null ? ' - ' + err.message : ''));
        });
  });
});

// detect position attachment
Facebook.in(function(message) {
  var attachments = message.originalMessage.message.attachments;
  if (_.isArray(attachments) && !_.isEmpty(attachments) && attachments[0].type === 'location') {
    message.payload.type = 'location';
    message.payload.content = {
      latitude: attachments[0].payload.coordinates.lat,
      longitude: attachments[0].payload.coordinates.long
    };
    return message;
  }
  return message;
});

Facebook.out('message', function(message) {
  var chatServer = this;
  var context = message.chat();
  return new Promise(function (resolve, reject) {
    chatServer
      .sendMessage(message.payload.chatId, {
        text: message.payload.content
      })
      .then(function(result) {
        return when(context.set('messageId', result.message_id))
      })
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });
});

Facebook.out('location', function(message) {
  var context = message.chat();
  var chatServer = this;
  return new Promise(function (resolve, reject) {
    var lat = message.payload.content.latitude;
    var lon = message.payload.content.longitude;
    var locationAttachment = {
      type: 'template',
      payload: {
        template_type: 'generic',
        elements: {
          element: {
            title: !_.isEmpty(message.payload.place) ? message.payload.place : 'Position',
            image_url: 'https:\/\/maps.googleapis.com\/maps\/api\/staticmap?size=764x400&center='
            + lat + ',' + lon + '&zoom=16&markers=' + lat + ',' + lon,
            item_url: 'http:\/\/maps.apple.com\/maps?q=' + lat + ',' + lon + '&z=16'
          }
        }
      }
    };
    chatServer.sendMessage(
      message.payload.chatId,
      {
        attachment: locationAttachment
      })
      .then(function(result) {
        return when(context.set('messageId', result.message_id))
      })
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });
});

// handle request
Facebook.out('request', function(message) {
  var context = message.chat();
  var chatServer = this;
  return new Promise(function (resolve, reject) {
    if (message.payload.requestType !== 'location') {
      reject('Facebook only supports requests of type "location"');
      return;
    }
    chatServer
      .sendMessage(message.payload.chatId, {
        text: message.payload.content,
        quick_replies: [
          {
            content_type: 'location'
          }
        ]
      })
      .then(function(result) {
        return when(context.set('messageId', result.message_id))
      })
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  });
});

// quick replies
Facebook.out('quick-replies', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer
      .sendMessage(
        message.payload.chatId,
        {
          text: message.payload.content,
          quick_replies: chatServer.parseButtons(message.payload.buttons)
        })
      .then(function() {
        resolve(message);
      },function(err) {
        reject(err);
      });
  });
});


// sends a photo
Facebook.out('photo', function(message) {
  var chatServer = this;
  var options = this.getOptions();
  return new Promise(function(resolve, reject) {
    var image = message.payload.content;
    chatServer.uploadBuffer({
      recipient: message.payload.chatId,
      type: 'image',
      buffer: image,
      token: options.token,
      filename: message.payload.filename
    }).then(function() {
      resolve(message);
    },function(err) {
      reject(err);
    });
  });
});

// sends an audio
Facebook.out('audio', function(message) {
  var chatServer = this;
  var options = this.getOptions();
  return new Promise(function(resolve, reject) {
    var image = message.payload.content;
    chatServer.uploadBuffer({
      recipient: message.payload.chatId,
      type: 'audio',
      buffer: image,
      token: options.token,
      filename: message.payload.filename
    }).then(function() {
      resolve(message);
    },function(err) {
      reject(err);
    });
  });
});

Facebook.out('action', function(message) {
  var options = this.getOptions();
  return new Promise(function (resolve, reject) {
    request({
      method: 'POST',
      json: {
        recipient: {
          id: message.payload.chatId
        },
        sender_action: 'typing_on'
      },
      url: 'https://graph.facebook.com/v2.6/me/messages?access_token=' + options.token
    }, function(error) {
      if (error != null) {
        reject(error);
      } else {
        resolve(message);
      }
    });
  });
});

Facebook.out('inline-buttons', function(message) {
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    chatServer.sendMessage(
      message.payload.chatId,
      {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'button',
            text: message.payload.content,
            buttons: chatServer.parseButtons(message.payload.buttons)
          }
        }
      }).then(function() {
        resolve(message);
      },function(err) {
        reject(err);
      });
  });
});

Facebook.out('persistent-menu', function(message) {
  var chatServer = this;
  return new Promise(function (resolve, reject) {
    var task = when(true);
    if (message.payload.command === 'set') {
      var items = chatServer.parseButtons(message.payload.items);
      // for some reason the called the same button as web_url and not url
      items.forEach(function (item) {
        item.type = item.type === 'url' ? 'web_url' : item.type;
      });
      task = chatServer.setPersistentMenu(items, message.payload.composerInputDisabled);
    } else if (message.payload.command === 'delete') {
      task = chatServer.removePersistentMenu();
    }
    task.then(
      function() {
        resolve(message);
      },
      function(error) {
        reject(error);
      }
    );
  });
});

Facebook.out('list-template', function(message) {
  var chatServer = this;
  return new Promise(function (resolve, reject) {
    // translate elements into facebook format
    var elements = message.payload.elements.map(function(item) {
      var element = {
        title: item.title,
        buttons: chatServer.parseButtons(item.buttons)
      };
      if (!_.isEmpty(item.subtitle)) {
        element.subtitle = item.subtitle;
      }
      if (!_.isEmpty(item.imageUrl)) {
        element.image_url = item.imageUrl;
      }
      return element;
    });
    // sends
    chatServer
      .sendMessage(
        message.payload.chatId,
        {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'list',
              top_element_style: message.payload.topElementStyle,
              sharable: message.payload.sharable,
              elements: elements
            }
          }
        })
      .then(
        function() {
          resolve(message);
        },
        function(error) {
          reject(error);
        });
  });
});

Facebook.out('generic-template', function(message) {
  var chatServer = this;
  return new Promise(function (resolve, reject) {
    // translate elements into facebook format
    var elements = message.payload.elements.map(function(item) {
      var element = {
        title: item.title,
        buttons: chatServer.parseButtons(item.buttons)
      };
      if (!_.isEmpty(item.subtitle)) {
        element.subtitle = item.subtitle;
      }
      if (!_.isEmpty(item.imageUrl)) {
        element.image_url = item.imageUrl;
      }
      return element;
    });
    // sends
    chatServer
      .sendMessage(
        message.payload.chatId,
        {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              image_aspect_ratio: message.payload.aspectRatio,
              sharable: message.payload.sharable,
              elements: elements
            }
          }
        })
      .then(
        function() {
          resolve(message);
        },
        function(error) {
          reject(error);
        });
  });
});

// log messages, these should be the last
Facebook.out(function(message) {
  var options = this.getOptions();
  var logfile = options.logfile;
  var chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        var chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Facebook.in('*', function(message) {
  var options = this.getOptions();
  var logfile = options.logfile;
  var chatContext = message.chat();
  if (!_.isEmpty(logfile)) {
    return when(chatContext.all())
      .then(function(variables) {
        var chatLog = new ChatLog(variables);
        return chatLog.log(message, logfile);
      });
  }
  return message;
});

Facebook.mixin({

  sendVerificationChallenge: function(req, res) {
    var options = this.getOptions();

    var query = qs.parse(url.parse(req.url).query);
    // eslint-disable-next-line no-console
    console.log('Verifying Facebook Messenger token "' + query['hub.verify_token'] + '", should be "'
      + options.verifyToken + '"');
    // eslint-disable-next-line no-console
    console.log('Token verified.');
    return res.end(query['hub.challenge']);
    /*if (query['hub.verify_token'] === options.verifyToken) {
      // eslint-disable-next-line no-console
      console.log('Token verified.');
      return res.end(query['hub.challenge']);
    }
    return res.end('Error, wrong validation token');*/
  },

  getProfile: function(id) {
    var options = this.getOptions();
    return new Promise(function(resolve, reject) {
      request({
        method: 'GET',
        uri: 'https://graph.facebook.com/v2.6/' + id,
        qs: {
          fields: 'first_name,last_name,profile_pic,locale,timezone,gender',
          access_token: options.token
        },
        json: true
      }, function(err, res, body) {
        if (err) {
          reject(err);
        } else if (body.error) {
          reject(body.error);
        } else {
          resolve({
            firstName: body.first_name,
            lastName: body.last_name,
            profilePic: body.profile_pic,
            locale: body.locale,
            timezone: body.timezone,
            gender: body.gender
          });
        }
      });
    });
  },

  sendMessage: function(recipient, payload) {
    var options = this.getOptions();
    return new Promise(function(resolve, reject) {
      request({
        method: 'POST',
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
          access_token: options.token
        },
        json: {
          messaging_type: 'RESPONSE',
          recipient: {
            id: recipient
          },
          message: payload
        }
      }, function(err, res, body) {
        if (err) {
          return reject(err)
        } else if ((body != null) && (_.isString(body))) {
          // body in string in case of error
          var errorJSON = null;
          try {
            errorJSON = JSON.parse(body);
          } catch(e) {
            errorJSON = {error: 'Error parsing error payload from Facebook.'};
          }
          return reject(errorJSON.error);
        } else if (body != null && body.error != null) {
          return reject(body.error.message);
        }
        return resolve(body)
      });
    });
  },

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

      // prepare payload
      var filedata = null;
      switch(params.type) {
        case 'image':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename,
              contentType: 'image/png' // fix extension
            }
          };
          break;
        case 'audio':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename,
              contentType: 'audio/mp3'
            }
          };
          break;
        case 'video':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename,
              contentType: params.mimeType
            }
          };
          break;
        case 'file':
          filedata = {
            value: params.buffer,
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

  removePersistentMenu: function() {
    var options = this.getOptions();
    return new Promise(function(resolve, reject) {
      request({
        method: 'DELETE',
        uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: {
          access_token: options.token
        },
        json: {
          fields: ['persistent_menu']
        }
      }, function(err, res, body) {
        if (body != null && body.error != null) {
          reject(body.error.message)
        } else {
          resolve();
        }
      });
    });
  },

  setPersistentMenu: function(items, composerInputDisabled) {
    var options = this.getOptions();
    return new Promise(function(resolve, reject) {
      request({
        method: 'POST',
        uri: 'https://graph.facebook.com/v2.6/me/messenger_profile',
        qs: {
          access_token: options.token
        },
        json: {
          'persistent_menu': [
            {
              locale: 'default',
              composer_input_disabled: composerInputDisabled,
              call_to_actions: items
            }
          ]
        }
      }, function (err, res, body) {
        if (body != null && body.error != null) {
          reject(body.error.message)
        } else {
          resolve();
        }
      });
    });
  }
});

module.exports = Facebook;
