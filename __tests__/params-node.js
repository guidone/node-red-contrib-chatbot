const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const ParamsBlock = require('../nodes/chatbot-params');

describe('Chat params node', () => {

  it('should pass thru 1 key for slack for piled messages', function() {
    const msg = RED.createMessage([
      { content: 'first message' },
      { content: 'second message' }
    ], 'slack');
    RED.node.config({
      params: [
        { platform: 'telegram', name: 'my-value1', value: 42 },
        { platform: 'telegram', name: 'my-value2', value: true },
        { platform: 'telegram', name: 'my-value3', value: 'just a string' },
        { platform: 'slack', name: 'my-chatId', value: '{{chatId}}' }
      ]
    });
    ParamsBlock(RED);
    msg.chat().set({ chatId: '42' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        const message = RED.node.message(0);
        assert.equal(message.originalMessage.chat.id, '42');
        assert.isArray(message.payload)
        assert.equal(message.payload[0].content, 'first message');
        assert.lengthOf(Object.keys(message.payload[0].params), 1);
        assert.equal(message.payload[0].params['my-chatId'], '42');
        assert.equal(message.payload[1].content, 'second message');
        assert.lengthOf(Object.keys(message.payload[1].params), 1);
        assert.equal(message.payload[1].params['my-chatId'], '42');
      });
  });

  it('should pass thru 3 keys for telegram', function() {
    const msg = RED.createMessage({ content: 'a payload'}, 'telegram');
    RED.node.config({
      params: [
        { platform: 'telegram', name: 'my-value1', value: 42 },
        { platform: 'telegram', name: 'my-value2', value: true },
        { platform: 'telegram', name: 'my-value3', value: 'just a string' },
        { platform: 'slack', name: 'my-chatId', value: '{{chatId}}' }
      ]
    });
    ParamsBlock(RED);
    msg.chat().set({});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        const message = RED.node.message(0);
        assert.equal(message.originalMessage.chat.id, '42');
        assert.equal(message.payload.content, 'a payload');
        assert.lengthOf(Object.keys(message.payload.params), 3);
        assert.equal(message.payload.params['my-value3'], 'just a string');
        assert.equal(message.payload.params['my-value2'], true);
        assert.strictEqual(message.payload.params['my-value1'], 42);
      });
  });

  it('should pass thru 3 keys for telegram in upstream nodes', function() {
    const msg = RED.createMessage({
      content: 'a payload',
      params: [
        { platform: 'telegram', name: 'my-value1', value: 42 },
        { platform: 'telegram', name: 'my-value2', value: true },
        { platform: 'telegram', name: 'my-value3', value: 'just a string' },
        { platform: 'slack', name: 'my-chatId', value: '{{chatId}}' }
      ]
    }, 'telegram');
    RED.node.config({});
    ParamsBlock(RED);
    msg.chat().set({});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        const message = RED.node.message(0);
        assert.equal(message.originalMessage.chat.id, '42');
        assert.equal(message.payload.content, 'a payload');
        assert.lengthOf(Object.keys(message.payload.params), 3);
        assert.equal(message.payload.params['my-value3'], 'just a string');
        assert.equal(message.payload.params['my-value2'], true);
        assert.strictEqual(message.payload.params['my-value1'], 42);
      });
  });

  it('should pass thru 1 key for slack', function() {
    const msg = RED.createMessage({ content: 'a payload' }, 'slack');
    RED.node.config({
      params: [
        { platform: 'telegram', name: 'my-value1', value: 42 },
        { platform: 'telegram', name: 'my-value2', value: true },
        { platform: 'telegram', name: 'my-value3', value: 'just a string' },
        { platform: 'slack', name: 'my-chatId', value: '{{chatId}}' }
      ]
    });
    ParamsBlock(RED);
    msg.chat().set({ chatId: '42' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        const message = RED.node.message(0);
        assert.equal(message.originalMessage.chat.id, '42');
        assert.equal(message.payload.content, 'a payload');
        assert.lengthOf(Object.keys(message.payload.params), 1);
        assert.equal(message.payload.params['my-chatId'], '42');
      });
  });

  it('should pass thru 1 key for slack in upstream node', function() {
    const msg = RED.createMessage({
      content: 'a payload',
      params: [
        { platform: 'telegram', name: 'my-value1', value: 42 },
        { platform: 'telegram', name: 'my-value2', value: true },
        { platform: 'telegram', name: 'my-value3', value: 'just a string' },
        { platform: 'slack', name: 'my-chatId', value: '{{chatId}}' }
      ]
    }, 'slack');
    RED.node.config({});
    ParamsBlock(RED);
    msg.chat().set({ chatId: '42' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        const message = RED.node.message(0);
        assert.equal(message.originalMessage.chat.id, '42');
        assert.equal(message.payload.content, 'a payload');
        assert.lengthOf(Object.keys(message.payload.params), 1);
        assert.equal(message.payload.params['my-chatId'], '42');
      });
  });

  it('should pass thru 0 key for viber', function() {
    const msg = RED.createMessage({ content: 'a payload'}, 'viber');
    RED.node.config({
      params: [
        { platform: 'telegram', name: 'my-value1', value: 42 },
        { platform: 'telegram', name: 'my-value2', value: true },
        { platform: 'telegram', name: 'my-value3', value: 'just a string' },
        { platform: 'slack', name: 'my-chatId', value: '{{chatId}}' }
      ]
    });
    ParamsBlock(RED);
    msg.chat().set({ chatId: '42' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        const message = RED.node.message(0);
        assert.equal(message.originalMessage.chat.id, '42');
        assert.equal(message.payload.content, 'a payload');
        assert.lengthOf(Object.keys(message.payload.params), 0);
      });
  });

});
