var _ = require('underscore');
var validators = require('../helpers/validators');
var moment = require('moment');
var ChatExpress = require('../chat-platform/chat-platform');
var TelegramBot = require('node-telegram-bot-api');
var request = require('request').defaults({ encoding: null });
var utils = require('../../lib/helpers/utils');
var when = utils.when;
var ChatLog = require('../chat-log');

var Telegram = new ChatExpress({
  inboundMessageEvent: 'message',
  transport: 'telegram',
  relaxChatId: true, // sometimes chatId is not necessary (for example inline_query_id)
  chatIdKey: function(payload) {
    return payload.chat != null ? payload.chat.id : null;
  },
  userIdKey: function(payload) {
    return payload.from.username;
  },
  tsKey: function(payload) {
    return moment.unix(payload.date);
  },
  type: function() {
    // todo remove this
  },
  language: function(payload) {
    return payload != null && payload.from != null ? payload.from.language_code : null;
  },
  onStop: function() {
    var options = this.getOptions();
    return new Promise(function(resolve) {
      if (options.connector != null) {
        options.connector.stopPolling()
          .then(function() {
            options.connector = null;
            resolve();
          }, function() {
            resolve();
          });
      } else {
        resolve();
      }
    });
  },
  onStart: function() {
    var options = this.getOptions();
    options.connector = new TelegramBot(options.token, {
      polling: {
        params: {
          timeout: 10
        },
        interval: !isNaN(parseInt(options.polling, 10)) ? parseInt(options.polling, 10) : 1000
      }
    });
    //options.connector.setMaxListeners(0);
    return true;
  },
  events: {
    inline_query: function(botMsg) {
      botMsg.inlineQueryId = botMsg.id;
      delete botMsg.id;
      this.receive(botMsg);
    },
    callback_query: function(botMsg) {
      var chatServer = this;
      var options = this.getOptions();
      var connector = options.connector;
      var chatId = botMsg.message.chat.id;
      var alert = false;
      var answer = null;
      if (connector.lastInlineButtons != null && connector.lastInlineButtons[chatId] != null) {
        // find the button with the right value, takes the answer and alert if any
        var button = _(connector.lastInlineButtons[chatId]).findWhere({value: botMsg.data});
        if (button != null) {
          answer = button.answer;
          alert = button.alert;
        }
        // do not remove from hash, the user could click again
      }
      // copy the "from" of the message containing user information, not chatbot detail
      botMsg.message.from = botMsg.from;
      // send answer back to client
      connector.answerCallbackQuery(botMsg.id, { text: answer, show_alert: alert })
        .then(function() {
          // send through the message as usual
          botMsg.message.text = botMsg.data;
          chatServer.receive(botMsg.message);
        });
    },
    pre_checkout_query: function(botMsg) {
      var chatServer = this;
      var options = this.getOptions();
      var connector = options.connector;
      // send confirmation
      connector.answerPreCheckoutQuery(botMsg.id, true)
        .then(
          function(resp) {
          },
          function() {
            chatServer.error('Error on .answerPreCheckoutQuery(), checkout: ' + botMsg.id);
          });
    },
    shipping_query: function(botMsg) {
      var chatServer = this;
      // bounce the message into the flow
      chatServer.receive({
        from: botMsg.from,
        shipping_query_id: botMsg.id,
        invoice_payload: botMsg.invoice_payload,
        shipping_address: botMsg.shipping_address
      });
    }
  },
  debug: true
});

Telegram.in(function(message) {
  return new Promise(function(resolve) {
    if (message.originalMessage.query != null) {
      message.payload.content = message.originalMessage.query;
      message.payload.type = 'inline-query';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  return new Promise(function(resolve, reject) {
    var chatContext = message.chat();
    if (_.isString(message.originalMessage.text) && !_.isEmpty(message.originalMessage.text)) {
      message.payload.content = message.originalMessage.text;
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

Telegram.in(function(message) {
  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    if (botMsg.location != null) {
      message.payload.content = botMsg.location;
      message.payload.type = 'location';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    if (botMsg.contact != null) {
      message.payload.content = botMsg.contact;
      message.payload.type = 'contact';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {
    if (botMsg.successful_payment != null) {
      message.payload.content = botMsg.successful_payment;
      message.payload.type = 'payment';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {

  var botMsg = message.originalMessage;
  return new Promise(function(resolve) {

    if (botMsg.shipping_query_id != null) {
      message.payload.shippingQueryId = botMsg.shipping_query_id;
      message.payload.payload = botMsg.payload;
      message.payload.shippingAddress = botMsg.shipping_address;
      message.payload.type = 'invoice-shipping';
      resolve(message);
    } else {
      resolve(message);
    }
  });
});

Telegram.in(function(message) {
  var vars = {};
  var context = message.chat();
  var options = this.getOptions();
  var authorizedUsernames = options.authorizedUsernames;
  var userId = String(message.originalMessage.from.id);
  var username = String(message.originalMessage.from.username);

  return new Promise(function(resolve, reject) {
    if (!_.isEmpty(message.originalMessage.from.first_name)) {
      vars.firstName = message.originalMessage.from.first_name;
    }
    if (!_.isEmpty(message.originalMessage.from.last_name)) {
      vars.lastName = message.originalMessage.from.last_name;
    }

    vars.authorized = false;
    if (_.isArray(authorizedUsernames) && !_.isEmpty(authorizedUsernames)) {
      if (_.contains(authorizedUsernames, userId) || _.contains(authorizedUsernames, username)) {
        vars.authorized = true;
      }
    }

    return when(context.set(vars))
      .then(function() {
        resolve(message);
      }, reject);
  });
});

Telegram.in(function(message) {
  var connector = this.getOptions().connector;
  var botMsg = message.originalMessage;
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    var type = null;
    var fileId = null;
    // download one of these binary types
    if (botMsg.photo != null) {
      type = 'photo';
      fileId = _(botMsg.photo).last().file_id;
    } else if (botMsg.video != null) {
      type = 'video';
      fileId = botMsg.video.file_id;
    } else if (botMsg.voice != null) {
      type = 'audio';
      fileId = botMsg.voice.file_id;
    } else if (botMsg.document != null) {
      type = 'document';
      fileId = botMsg.document.file_id;
    }
    // if not one of these pass thru
    if (type != null) {
      message.payload.type = type;
      connector.getFileLink(fileId)
        .then(function(path) {
          return chatServer.downloadFile(path);
        })
        .then(
          function(buffer) {
            message.payload.content = buffer;
            message.payload.caption = botMsg.caption;
            resolve(message);
          },
          function() {
            reject('Error downloading photo');
          });
    } else {
      resolve(message);
    }
  });
});

Telegram.out('photo', function(message) {
  var connector = this.getOptions().connector;
  return new Promise(function(resolve, reject) {
    connector.sendPhoto(message.payload.chatId, message.payload.content, {
      caption: message.payload.caption
    }).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });
  });
});

Telegram.out('video', function(message) {
  var connector = this.getOptions().connector;
  return new Promise(function(resolve, reject) {
    connector.sendVideo(message.payload.chatId, message.payload.content, {
      caption: message.payload.caption
    }).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });
  });
});

Telegram.out('document', function(message) {
  var connector = this.getOptions().connector;
  return new Promise(function(resolve, reject) {
    connector.sendDocument(message.payload.chatId, message.payload.content, {
      caption: message.payload.caption
    }).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });
  });
});

Telegram.out('audio', function(message) {
  var connector = this.getOptions().connector;
  return new Promise(function(resolve, reject) {
    connector.sendVoice(message.payload.chatId, message.payload.content, {
      caption: message.payload.caption
    }).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });
  });
});

Telegram.out('reset-buttons', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  var parseMode = options.parseMode != null ? options.parseMode : null;

  return new Promise(function(resolve, reject) {
    // finally send
    connector.sendMessage(
      message.payload.chatId,
      message.payload.content,
      {
        reply_markup: {
          remove_keyboard: true
        },
        parse_mode: parseMode
      }
    ).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });

  });
});

Telegram.out('buttons', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  var parseMode = options.parseMode != null ? options.parseMode : null;
  var chatServer = this;
  return new Promise(function(resolve, reject) {
    if (_.isEmpty(message.payload.content)) {
      reject('Buttons node needs a non-empty message');
      return;
    }
    var keyboard = [[]];
    _(message.payload.buttons).each(function(button) {
      var json = null;
      switch(button.type) {
        case 'keyboardButton':
          json = button.label;
          break;
        case 'newline':
          keyboard.push([]);
          break;
        default:
          chatServer.warn('Telegram is not able to handle this button type "' + button.type + '"');
      }
      if (json != null) {
        // add the button to the last row, if any
        keyboard[keyboard.length - 1].push(json);
      }
    });

    var buttons = {
      reply_markup: JSON.stringify({
        keyboard: keyboard,
        resize_keyboard: true,
        one_time_keyboard: true
      }),
      parse_mode: parseMode
    };
    // finally send
    connector.sendMessage(
      message.payload.chatId,
      message.payload.content,
      buttons
    ).then(function() {
      resolve(message);
    }, function(error) {
      reject(error);
    });
  });
});

Telegram.out('request', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  return new Promise(function(resolve, reject) {
    var keyboard = null;
    if (message.payload.requestType === 'location') {
      keyboard = [
        [{
          text: !_.isEmpty(message.payload.label) ? message.payload.label : 'Send your position',
          request_location: true
        }]
      ];
    } else if (message.payload.requestType === 'phone-number') {
      keyboard = [
        [{
          text: !_.isEmpty(message.payload.label) ? message.payload.label : 'Send your phone number',
          request_contact: true
        }]
      ];
    }
    if (keyboard != null) {
      connector
        .sendMessage(message.payload.chatId, message.payload.content, {
          reply_markup: JSON.stringify({
            keyboard: keyboard,
            'resize_keyboard': true,
            'one_time_keyboard': true
          })
        })
        .then(function() {
          resolve(message);
        }, function(error) {
          reject(error);
        });
    } else {
      reject('Request type not supported');
    }
  });
});


Telegram.out('inline-buttons', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  var parseMode = options.parseMode != null ? options.parseMode : null;
  var chatServer = this;
  var context = message.chat();
  return new Promise(function (resolve, reject) {
    // create inline buttons, docs for this is https://core.telegram.org/bots/api#inlinekeyboardmarkup
    // create the first array of array
    var inlineKeyboard = [[]];
    var chatId = message.payload.chatId;
    // cycle through buttons, add new line at the end if flag
    _(message.payload.buttons).each(function(button) {
      var json = null;
      switch(button.type) {
        case 'url':
          json = {
            text: button.label,
            url: button.url
          };
          break;
        case 'postback':
          json = {
            text: button.label,
            callback_data: !_.isEmpty(button.value) ? button.value : button.label
          };
          break;
        case 'newline':
          inlineKeyboard.push([]);
          break;
        default:
          chatServer.warn('Telegram is not able to handle this button type "' + button.type + '"');
      }
      if (json != null) {
        // add the button to the last row, if any
        inlineKeyboard[inlineKeyboard.length - 1].push(json);
      }
    });
    // store the last buttons, this will be handled by the receiver
    if (connector.lastInlineButtons == null) {
      connector.lastInlineButtons = {};
    }
    connector.lastInlineButtons[chatId] = message.payload.buttons;
    // send buttons or edit
    var task = null;
    if (message.originalMessage.modifyMessageId != null) {
      task = connector.editMessageReplyMarkup(JSON.stringify({
        inline_keyboard: inlineKeyboard
      }), {
        chat_id: chatId,
        message_id: message.originalMessage.modifyMessageId
      });
    } else {
      // finally send
      task = connector.sendMessage(chatId, message.payload.content, {
        reply_markup: JSON.stringify({
          inline_keyboard: inlineKeyboard
        }),
        parse_mode: parseMode
      });
    }
    // finally
    task
      .then(function(result) {
        return when(context.set('messageId', result.message_id))
      })
      .then(function() {
        resolve(message)
      }, function(error) {
        reject(error);
      });
  });
});


Telegram.out('message', function(message) {
  var options = this.getOptions();
  var connector = message.client();
  var context = message.chat();
  var parseMode = options.parseMode != null ? options.parseMode : null;
  return new Promise(function (resolve, reject) {
    var task = null;
    if (message.originalMessage.modifyMessageId != null) {
      task = connector.editMessageText(message.payload.content, {
        chat_id: message.payload.chatId,
        message_id: message.originalMessage.modifyMessageId
      });
    } else {
      task = connector.sendMessage(message.payload.chatId, message.payload.content, { parse_mode: parseMode });
    }
    task
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


Telegram.out('action', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  return new Promise(function (resolve, reject) {
    connector.sendChatAction(message.payload.chatId, message.payload.waitingType != null ? message.payload.waitingType : 'typing')
      .then(function() {
        resolve(message);
      }, function(error) {
        reject(error);
      });
  })
});

Telegram.out('location', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  return new Promise(function (resolve, reject) {
    connector.sendLocation(
      message.payload.chatId,
      message.payload.content.latitude,
      message.payload.content.longitude,
      message.payload.options
    ).then(
      function() {
        resolve(message);
      },
      function(error) {
        reject(error);
      });
  })
});

Telegram.out('inline-query-answer', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  return new Promise(function (resolve, reject) {
    var inlineQueryId = message.originalMessage.inlineQueryId;
    // do some checks
    if (_.isEmpty(inlineQueryId)) {
      reject('Empty inlineQueryId');
      return;
    }
    if (!_.isArray(message.payload.content)) {
      reject('Invalid inline query answer');
      return;
    }
    var options = {};
    if (validators.integer(message.payload.caching)) {
      options.cache_time = message.payload.caching;
    }
    if (validators.boolean(message.payload.personal)) {
      options.is_personal = message.payload.personal;
    }

    connector.answerInlineQuery(inlineQueryId, message.payload.content, options)
      .then(
        function() {
          resolve(message);
        },
        function(error) {
          reject(error);
        });
  });
});

Telegram.out('invoice', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  return new Promise(function (resolve, reject) {

    if (_.isEmpty(options.providerToken)) {
      reject('Missing providerToken in Telegram chatbot configuration, needed to send an invoice.');
      return;
    }

    var invoiceOptions = {
      need_name: message.payload.needName,
      need_phone_number: message.payload.needPhoneNumber,
      need_email: message.payload.needEmail,
      need_shipping_address: message.payload.needShippingAddress,
      is_flexible: message.payload.isFlexible
    };

    connector.sendInvoice(
      message.payload.chatId,
      message.payload.title,
      message.payload.description,
      message.payload.payload,
      options.providerToken,
      message.payload.startParameter,
      message.payload.currency,
      _(message.payload.prices).map(function(price) {
        return {
          label: price.label,
          amount: Math.floor(parseFloat(price.amount) * 100)
        }
      }),
      invoiceOptions)
      .then(
        function(result) {
        },
        function(error) {
          reject(error);
        });
  });
});

Telegram.out('invoice-shipping', function(message) {
  var options = this.getOptions();
  var connector = options.connector;
  return new Promise(function (resolve, reject) {
    var shippingOptions = _(message.payload.shippingOptions).map(function(shippingOption) {
      return {
        id: shippingOption.id,
        title: shippingOption.label,
        prices: [{ label: shippingOption.id, amount: Math.floor(shippingOption.amount * 100) }]
      };
    });
    var canShip = !_.isEmpty(shippingOptions);
    connector.answerShippingQuery(message.payload.shippingQueryId, canShip, { shipping_options: shippingOptions })
      .then(
        function() {
          // do nothing
        },
        function(error) {
          reject(error);
        }
      );
  });
});

// log messages, these should be the last
Telegram.out(function(message) {
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

Telegram.in('*', function(message) {
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

Telegram.mixin({
  downloadFile: function (url, token) {
    return new Promise(function (resolve, reject) {
      var options = {
        url: url,
        headers: {
          'Authorization': 'Bearer ' + token
        }
      };
      request(options, function (error, response, body) {
        if (error) {
          reject(error);
        } else {
          resolve(body);
        }
      });
    });
  }
});

module.exports = Telegram;
