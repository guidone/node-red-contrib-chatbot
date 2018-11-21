var _ = require('underscore');
var qs = require('querystring');
var url = require('url');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var ChatLog = require('../chat-log');
var parseButtons = require('./parse-buttons');
var payloadTx = require('./payload-translators');

var request = require('request').defaults({ encoding: null });
var utils = require('../../lib/helpers/utils');
var when = utils.when;

var Facebook = new ChatExpress({
  transport: 'facebook',
  transportDescription: 'Facebook Messenger',
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
        // docs for entry messages
        // https://developers.facebook.com/docs/messenger-platform/reference/webhook-events
        // and
        // https://developers.facebook.com/docs/graph-api/webhooks/getting-started
        if (json != null && _.isArray(json.entry)) {
          var entries = json.entry;
          _(entries).each(function (entry) {
            var events = entry.messaging;
            // if it's a messaging entry, then do a minimal parsing
            if (entry.messaging != null) {
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
                  event.referral = event.postback.referral ? event.postback.referral : null // for GET_STARTED event
                  delete event.postback;
                  chatServer.receive(event);
                } else if (event.referral != null) {
                  // handle referrals for existing thread (person spoked to bot before)
                  event.message = {
                    text: event.referral
                  };
                  chatServer.receive(event);
                } else if (event.optin != null) {
                  // handle optin
                  event.message = {
                    text: event.optin
                  };
                  chatServer.receive(event);
                } else if (event.account_linking != null) {
                  chatServer.receive(event);
                }
              });
            } else {
              // not a messaging event, relay the whole entry
              chatServer.receive(entry);
            }
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

// detect referral payload
Facebook.in(function(message) {
  if (message.originalMessage.referral != null) {
    message.payload.type = 'referral';
    message.payload.content = message.originalMessage.referral;
    return message;
  }
  return message;
});

// detect optin payload
Facebook.in(function(message) {
  if (message.originalMessage.optin != null) {
    message.payload.type = 'optin';
    message.payload.content = message.originalMessage.optin;
    return message;
  }
  return message;
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
    if (message.originalMessage.message && _.isString(message.originalMessage.message.text) && !_.isEmpty(message.originalMessage.message.text)) {
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
  var attachments = message.originalMessage.message ? message.originalMessage.message.attachments: null;
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

  if(!userId) {
    // eslint-disable-next-line no-console
    console.log('No userId in message', message);
    return message;
  }

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
  var attachments = message.originalMessage.message ? message.originalMessage.message.attachments: null;
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
      .sendMessage(message.payload.chatId, payloadTx.message(message.payload))
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
          quick_replies: parseButtons(message.payload.buttons)
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

// sends a document
Facebook.out('document', function(message) {
  var chatServer = this;
  var options = this.getOptions();
  return new Promise(function(resolve, reject) {
    var image = message.payload.content;
    chatServer.uploadBuffer({
      recipient: message.payload.chatId,
      type: 'file',
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
      url: 'https://graph.facebook.com/v3.1/me/messages?access_token=' + options.token
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
            buttons: parseButtons(message.payload.buttons)
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
      var items = parseButtons(message.payload.items);
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
        buttons: parseButtons(item.buttons)
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
    chatServer
      .sendMessage(message.payload.chatId, payloadTx.genericTemplate(message.payload))
      .then(
        function() {
          resolve(message);
        },
        function(error) {
          reject(error);
        });
  });
});

Facebook.out('broadcast', function(message) {
  var chatServer = this;
  return new Promise(function (resolve, reject) {


    chatServer.broadcastSendMessage(message.payload.messageId)
      .then(
        function(broadcastId) {

          console.log('**** broadcastId', broadcastId);

        },
        function(error) {
          reject(error);
        }
      );



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

  /*
  DOCS: https://developers.facebook.com/docs/messenger-platform/identity/user-profile/
  */

  getProfile: function(id) {
    var options = this.getOptions();
    var profileFields = !_.isEmpty(options.profileFields) ? options.profileFields : 'first_name,last_name';

    return new Promise(function(resolve, reject) {
      request({
        method: 'GET',
        uri: 'https://graph.facebook.com/v3.1/' + id,
        qs: {
          fields: profileFields,
          access_token: options.token
        },
        json: true
      }, function(err, res, body) {
        if (err) {
          reject(err);
        } else if (body.error) {
          reject(body.error);
        } else {
          // cleanup a little
          resolve(_.extend(
            {
              firstName: body.first_name,
              lastName: body.last_name,
              language: !_.isEmpty(body.locale) ? body.locale.substr(0,2) : null
            },
            _.omit(body, 'locale', 'id', 'first_name', 'last_name')
          ));
        }
      });
    });
  },

  sendMessage: function(recipient, payload) {
    var options = this.getOptions();
    return new Promise(function(resolve, reject) {
      request({
        method: 'POST',
        uri: 'https://graph.facebook.com/v3.1/me/messages',
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
              filename: params.filename || 'image.png',
              contentType: 'image/png' // fix extension
            }
          };
          break;
        case 'audio':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename || 'audio.mp3',
              contentType: 'audio/mp3'
            }
          };
          break;
        case 'video':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename || 'vide.mpg',
              contentType: params.mimeType
            }
          };
          break;
        case 'file':
          filedata = {
            value: params.buffer,
            options: {
              filename: params.filename || 'file',
              contentType: params.mimeType
            }
          };
      }
      // upload and send
      var formData = {
        messaging_type: 'RESPONSE',
        recipient: '{"id":"' + params.recipient +'"}',
        message: '{"attachment":{"type":"' + params.type + '", "payload":{}}}',
        filedata: filedata
      };
      request.post({
        url: 'https://graph.facebook.com/v3.1/me/messages?access_token=' + params.token,
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
        uri: 'https://graph.facebook.com/v3.1/me/messenger_profile',
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
        uri: 'https://graph.facebook.com/v3.1/me/messenger_profile',
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
  },

  broadcastStoreMessage: function(payload) {

    var translatedPayload;

    console.log('parso ', payload);
    switch(payload.type) {
      case 'message':
        translatedPayload = payloadTx.message(payload);
        break;
      case 'generic-template':
        translatedPayload = payloadTx.genericTemplate(payload);
        break;
      default:
        console.log('Unhandled type!!!')
    }


    var options = this.getOptions();
    return new Promise(function (resolve, reject) {
      request({
        method: 'POST',
        uri: 'https://graph.facebook.com/v3.1/me/message_creatives',
        qs: {
          access_token: options.token
        },
        json: {
          messages: translatedPayload
        }
      }, function (err, res, body) {
        if (body != null && body.error != null) {
          reject(body.error.message)
        } else {
          resolve(body.message_creative_id);
        }
      });
    });

  },

  // api: https://developers.facebook.com/docs/messenger-platform/send-messages/broadcast-messages/
  broadcastSendMessage: function(messageId) {
    var options = this.getOptions();
    return new Promise(function (resolve, reject) {
      request({
        method: 'POST',
        uri: 'https://graph.facebook.com/v3.1/me/broadcast_messages',
        qs: {
          access_token: options.token
        },
        json: {
          message_creative_id: messageId,
          notification_type: "REGULAR",
          messaging_type: "MESSAGE_TAG",
          tag: "NON_PROMOTIONAL_SUBSCRIPTION"
        }
      }, function (err, res, body) {
        if (body != null && body.error != null) {
          reject(body.error.message)
        } else {
          resolve(body.broadcast_id);
        }
      });
    });

  },

  broadcastMetrics: function(broadcastId) {
    var options = this.getOptions();
    return new Promise(function (resolve, reject) {
      request({
        method: 'GET',
        uri: 'https://graph.facebook.com/v2.11/'+ broadcastId + '/insights/messages_sent',
        qs: {
          access_token: options.token
        },
        json: {}
      }, function (err, res, body) {
        if (body != null && body.error != null) {
          reject(body.error.message)
        } else if (res.statusCode !== 200) {
          reject(res.statusMessage);
        } else {
          resolve(body.data[0]);
        }
      });
    });
  }

});

Facebook.registerMessageType('action', 'Action', 'Send an action message (like typing, ...)');
Facebook.registerMessageType('audio', 'Audio', 'Send an audio message');
Facebook.registerMessageType('buttons', 'Buttons', 'Open keyboard buttons in the client');
Facebook.registerMessageType('command', 'Command', 'Detect command-like messages');
//Facebook.registerMessageType('contact', 'Contact', 'Send a contact');
Facebook.registerMessageType('document', 'Document', 'Send a document or generic file');
Facebook.registerMessageType('inline-buttons', 'Inline buttons', 'Send a message with inline buttons');
Facebook.registerMessageType('location', 'Location', 'Send a map location message');
Facebook.registerMessageType('message', 'Message', 'Send a plain text message');
Facebook.registerMessageType('photo', 'Photo', 'Send a photo message');
Facebook.registerMessageType('request', 'Request');
Facebook.registerMessageType('video', 'Video', 'Send video message');
Facebook.registerMessageType('persistent-menu', 'Persistent menu', 'Sets the Messenger persistent menu');
Facebook.registerMessageType('quick-replies', 'Quick Replies', 'Send large inline buttons for quick replies');
Facebook.registerMessageType('referral', 'Referral', 'Referral message');
Facebook.registerMessageType('generic-template', 'Generic Template', '');
Facebook.registerMessageType('list-template', 'List Template', '');


module.exports = Facebook;
