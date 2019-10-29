const RegisterType = require('../lib/node-installer');
const _ = require('underscore');
const utils = require('../lib/helpers/utils');
const MessageTemplate = require('../lib/message-template-async');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotSlackBlocks(config) {    
    RED.nodes.createNode(this, config);
    const node = this;
    this.blocks = config.blocks;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.apply(node, error, msg) };
      
      const chatId = utils.getChatId(msg);
      const messageId = utils.getMessageId(msg);
      const template = MessageTemplate(msg, node);
      
      // parse blocks
      let blocks;
      try {
        blocks = JSON.parse(node.blocks);
      } catch(e) {
        done(e);
        return;
      }

      template(blocks)
        .then(renderedBlocks => {
          send({ 
            ...msg, 
            payload: {
              type: 'blocks',
              content: _.isObject(renderedBlocks) && renderedBlocks.blocks != null ? renderedBlocks.blocks : renderedBlocks,
              chatId: chatId,
              messageId: messageId,
              inbound: false
            }
          });
          done();
        });
    });
  }
  
  registerType('chatbot-slack-blocks', ChatBotSlackBlocks);
};
