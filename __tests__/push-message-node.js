const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const PushBlock = require('../nodes/chatbot-push-message');

describe('Chat push node', () => {
  it('push payload', async () => {
    const msg = RED.createRawMessage({
      payload: {
        type: 'message',
        content: 'the current message',
        inbound: false
      }
    });
    RED.node.config({});
    PushBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await()
    const previous = RED.node.message().previous;
    assert.equal(previous.type, 'message');
    assert.equal(previous.content, 'the current message');
    assert.equal(previous.inbound, false);
  });

});
