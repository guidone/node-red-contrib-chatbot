const _ = require('underscore');
const utils = require('../lib/helpers/utils');
const RegisterType = require('../lib/node-installer');
const fs = require('fs');

module.exports = function(RED) {
  const registerType = RegisterType(RED);

  function ChatBotNLPSave(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.filename = config.filename;

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      const filename = utils.extractValue('string', 'filename', node, msg, false);
      const manager = msg.payload; 

      if (manager != null && _.isFunction(manager.export)) {
        const json = manager.export(false);
        fs.writeFile(filename, json, (err) => {
          if (err) {
            done(err);
            return;
          }
          done();
        });
        return;
      } 

      done('Message payload is not a NLP manager class');
    });
  }

  registerType('chatbot-nlpjs-save', ChatBotNLPSave);
};
