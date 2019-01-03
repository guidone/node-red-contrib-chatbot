var Path = require('path');
var sanitize = require('sanitize-filename');
var _ = require('underscore');
var utils = require('../lib/helpers/utils');
var fetchers = require('../lib/helpers/fetchers');
var validators = require('../lib/helpers/validators');
var ChatExpress = require('../lib/chat-platform/chat-platform');

module.exports = function(RED) {

  function ChatBotImage(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.image = config.image;
    this.name = config.name;
    this.caption = config.caption;
    this.filename = config.filename; // for retrocompatibility
    this.transports = ['telegram', 'slack', 'facebook', 'smooch', 'viber'];

    this.on('input', function(msg) {

      var name = node.name;
      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);
      var filename = 'image';
      var transport = utils.getTransport(msg);

      // check if valid message
      if (!utils.isValidMessage(msg, node)) {
        return;
      }
      // check transport compatibility
      if (!ChatExpress.isSupported(transport, 'message') && !utils.matchTransport(node, msg)) {
        return;
      }

      var content = utils.extractValue('string', 'image', node, msg)
        || utils.extractValue('buffer', 'image', node, msg)
        || utils.extractValue('string', 'filename', node, msg); // for retrocompatibility
      var caption = utils.extractValue('string', 'caption', node, msg, false);
      // get the content
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
      } else if (_.isString(content) && content.length > 4064) {
        node.error('Looks like you are passing a very long string (> 4064 bytes) in the payload as image url or path\n'
          + 'Perhaps you are using a "Http request" and passing the result as string instead of buffer?');
        return;
      } else {
        node.error('Don\'t know how to handle: ' + content);
        return;
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
