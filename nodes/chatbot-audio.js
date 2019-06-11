const _ = require('underscore');
const fs = require('fs');
const Path = require('path');
const sanitize = require('sanitize-filename');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotAudio(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.filename = config.filename;
    this.name = config.name;
    this.transports = ['telegram', 'slack', 'facebook'];

    this.on('input', function(msg) {

      var path = node.filename;
      var name = node.name;

      var chatId = utils.getChatId(msg);
      var messageId = utils.getMessageId(msg);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }

      // todo make asynch here
      var content = msg.payload;
      if (!_.isEmpty(path)) {
        content = fs.readFileSync(path);
      }

      // get filename
      var filename = 'image';
      if (!_.isEmpty(path)) {
        filename = Path.basename(path);
      } else if (!_.isEmpty(name)) {
        filename = sanitize(name);
      }

      // send out the message
      msg.payload = {
        type: 'audio',
        content: content,
        filename: filename,
        chatId: chatId,
        messageId: messageId,
        inbound: false
      };

      // send out reply
      node.send(msg);
    });

  }

  registerType('chatbot-audio', ChatBotAudio);
};
