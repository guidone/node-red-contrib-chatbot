const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const LocationBlock = require('../nodes/chatbot-location');

require('../lib/platforms/telegram');
require('../lib/platforms/slack/index');

describe('Chat request node', () => {

  it('should send a location message in Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      latitude: '45.4842045',
      longitude: '9.1809077'
    });
    LocationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.isObject(RED.node.message().payload.content, 'is an object');
        assert.equal(RED.node.message().payload.content.latitude, '45.4842045');
        assert.equal(RED.node.message().payload.content.longitude, '9.1809077');
      });
  });

  it('should send a location message in Slack', () => {
    const msg = RED.createMessage(null, 'slack');
    RED.node.config({
      latitude: '45.4842045',
      longitude: '9.1809077'
    });
    LocationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.isObject(RED.node.message().payload.content, 'is an object');
        assert.equal(RED.node.message().payload.content.latitude, '45.4842045');
        assert.equal(RED.node.message().payload.content.longitude, '9.1809077');
      });
  });

});
