const utils = require('../lib/helpers/utils');
const validators = require('../lib/helpers/validators');
const fetchers = require('../lib/helpers/fetchers');
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotSticker(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.sticker = config.sticker;
    this.transports = ['telegram'];

    this.on('input', function(msg) {

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      var sticker = utils.extractValue('string', 'sticker', node, msg)
        || utils.extractValue('buffer', 'sticker', node, msg);

      var fetcher = null;
      if (validators.filepath(sticker)) {
        fetcher = fetchers.file;
      } else if (validators.url(sticker)) {
        fetcher = fetchers.url;
      } else if (validators.buffer(sticker) || validators.string(sticker)) {
        fetcher = fetchers.identity;
      } else {
        node.error('Don\'t know how to handle: ' + sticker);
      }

      fetcher(sticker)
        .then(
          function(value) {
            // send out the message
            msg.payload = {
              type: 'sticker',
              content: value,
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

  registerType('chatbot-sticker', ChatBotSticker);
};
