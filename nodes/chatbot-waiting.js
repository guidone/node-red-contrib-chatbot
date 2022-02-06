const _ = require('underscore');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const GlobalContextHelper = require('../lib/helpers/global-context-helper');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const globalContextHelper = GlobalContextHelper(RED);

  function ChatBotWaiting(config) {
    RED.nodes.createNode(this, config);
    globalContextHelper.init(this.context().global);

    this.waitingType = config.waitingType;
    this.transports = ['telegram', 'slack', 'facebook'];

    this.on('input', function(msg) {

      var node = this;
      var waitingType = this.waitingType;
      var chatId = utils.getChatId(msg);

      // check transport compatibility
      if (!utils.matchTransport(node, msg)) {
        return;
      }
      // in slack force the only typing available
      if (utils.getTransport(msg) === 'slack' && waitingType !== 'typing') {
        //node.warn('Only \'typing\' is supported for slack transport');
        waitingType = 'typing';
      }

      msg.payload = {
        type: 'action',
        waitingType: !_.isEmpty(waitingType) ? waitingType : 'typing',
        chatId: chatId,
        inbound: false
      };

      node.send(msg);
    });
  }
  registerType('chatbot-waiting', ChatBotWaiting);

};
