const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const PopBlock = require('../nodes/chatbot-pop-message');

describe('Chat pop node', () => {
  it('pop payload', async () => {
    const msg = RED.createRawMessage({
      previous: {
        type: 'message',
        content: 'the previous message',
        inbound: false
      },
      payload: {
        type: 'message',
        content: 'the current message',
        inbound: false
      }
    });
    RED.node.config({});
    PopBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await()
    const payload = RED.node.message().payload;
    assert.equal(payload.type, 'message');
    assert.equal(payload.content, 'the previous message');
    assert.equal(payload.inbound, false);
  });

});
