var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var ActionBlock = require('../nodes/chatbot-waiting');

describe('Chat waiting node', function() {

  it('should be a action message for Telegram', function() {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      waitingType: 'typing'
    });
    ActionBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.type, 'action');
    assert.equal(RED.node.message().payload.waitingType, 'typing');
  });

  it('should be a action message for Slack', function() {
    var msg = RED.createMessage(null, 'slack');
    RED.node.config({
      waitingType: 'typing'
    });
    ActionBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.type, 'action');
    assert.equal(RED.node.message().payload.waitingType, 'typing');
  });

  it('should be not available for Slack anything other than typing', function() {
    var msg = RED.createMessage(null, 'slack');
    RED.node.config({
      waitingType: 'upload_photo'
    });
    ActionBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.type, 'action');
    assert.equal(RED.node.message().payload.waitingType, 'typing');
  });

});

