const path = require('path');

module.exports = function(RED) {
  RED.plugins.registerPlugin('chatbot-launch-mission-control', {
    type: 'node-red'
  });

  RED.httpAdmin.get('/chatbot-launch-mission-control/redbot-logo.svg', function(req, res) {
    res.sendFile(path.join(__dirname, '..', 'docs', 'logo', 'redbot-logo.svg'));
  });
};
