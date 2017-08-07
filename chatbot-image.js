var _ = require('underscore');
var fs = require('fs');
var Path = require('path');
var sanitize = require("sanitize-filename");
var utils = require('./lib/helpers/utils');
var fetchers = require('./lib/helpers/fetchers');
var validators = require('./lib/helpers/validators');

module.exports = function(RED) {

  function ChatBotImage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.image = config.image;
    this.name = config.name;
    this.caption = config.caption;
    this.transports = ['telegram', 'slack', 'facebook', 'smooch'];

    this.on('input', function(msg) {

      var path = node.filename;
      var name = node.name;
      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var content = utils.extractValue('string', 'image', node, msg)
        || utils.extractValue('buffer', 'image', node, msg);

      // get filename
      /*var filename = 'image';
      if (_.!_.isEmpty(path)) {
        filename = Path.basename(path);
      } else if (!_.isEmpty(name)) {
        filename = sanitize(name);
      }*/

      var caption = utils.extractValue('string', 'caption', node, msg);

      var fetcher = null;
      if (validators.filepath(content)) {
        fetcher = fetchers.file;
        filename = Path.basename(content);
      } else if (validators.url(content)) {
        fetcher = fetchers.url;
        filename = sanitize(name);
      } else if (validators.buffer(content)) {
        fetcher = fetchers.identity;
        filename = sanitize(name);
      } else {
        node.error('Don\'t know how to handle: ' + content);
      }

      fetcher(content)
        .then(
          function(value) {
            // send out the message
            msg.payload = {
              type: 'photo',
              content: value,
              filename: filename,
              caption: caption,
              chatId: chatId,
              messageId: messageId,
              inbound: false
            };
            // send out reply
            node.send(msg);
          },
          node.error
        );

    });

  }

  RED.nodes.registerType('chatbot-image', ChatBotImage);
};
