const assert = require('chai').assert;
const ResponseBridge = require('../lib/platforms/deepchat/bridge');

describe('Deep Chat response bridge', function() {

  it('collects the messages produced by the flow while the request is open', async function() {
    const bridge = ResponseBridge({ timeout: 2000, collectWindow: 30 });
    const collecting = bridge.open('chat-1');
    bridge.push('chat-1', { text: 'first' });
    bridge.push('chat-1', { text: 'second' });
    const responses = await collecting;
    assert.deepEqual(responses, [{ text: 'first' }, { text: 'second' }]);
    bridge.destroy();
  });

  it('resolves with an empty list when the flow doesn\'t answer', async function() {
    const bridge = ResponseBridge({ timeout: 60, collectWindow: 30 });
    const responses = await bridge.open('chat-1');
    assert.deepEqual(responses, []);
    bridge.destroy();
  });

  it('buffers the messages produced with no request in flight and delivers them with the next one', async function() {
    const bridge = ResponseBridge({ timeout: 200, collectWindow: 30 });
    assert.isFalse(bridge.push('chat-1', { text: 'out of band' }));
    const responses = await bridge.open('chat-1');
    assert.deepEqual(responses, [{ text: 'out of band' }]);
    // the buffer is emptied
    assert.deepEqual(await bridge.open('chat-1'), []);
    bridge.destroy();
  });

  it('keeps the buffers of different conversations separated', async function() {
    const bridge = ResponseBridge({ timeout: 2000, collectWindow: 30 });
    const collecting = bridge.open('chat-1');
    bridge.push('chat-2', { text: 'not yours' });
    bridge.push('chat-1', { text: 'yours' });
    assert.deepEqual(await collecting, [{ text: 'yours' }]);
    assert.deepEqual(await bridge.open('chat-2'), [{ text: 'not yours' }]);
    bridge.destroy();
  });

  it('flushes the pending request when the same conversation sends another message', async function() {
    const bridge = ResponseBridge({ timeout: 5000, collectWindow: 5000 });
    const first = bridge.open('chat-1');
    bridge.push('chat-1', { text: 'answer of the first' });
    bridge.open('chat-1');
    assert.deepEqual(await first, [{ text: 'answer of the first' }]);
    bridge.destroy();
  });

  it('resolves every open request on destroy', async function() {
    const bridge = ResponseBridge({ timeout: 60000, collectWindow: 60000 });
    const collecting = bridge.open('chat-1');
    bridge.destroy();
    assert.deepEqual(await collecting, []);
  });

});
