//var qr = require('qr-image');
//var MessageTemplate = require('../lib/message-template-async');
//var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  function ChatBotExtend(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.codeJs = config.codeJs;

  }
  RED.nodes.registerType('chatbot-extend', ChatBotExtend);

};
