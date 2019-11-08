const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const AnimationBlock = require('../nodes/chatbot-animation');
const fs = require('fs');

require('../lib/platforms/telegram');

describe('Chat animation node', function() {

  it('should send a sticker message with buffer from payload', () => {
    const msg = RED.createMessage(new Buffer('image'), 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    AnimationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'animation');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a sticker message with filename from payload', () => {
    const msg = RED.createMessage(`${__dirname}/dummy/file.mp4`, 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    AnimationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'animation');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a sticker message with filename from payload (named parameter)', () => {
    const msg = RED.createMessage({
      animation: `${__dirname}/dummy/file.mp4`
    }, 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    AnimationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'animation');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a sticker message with buffer from payload (named parameter)', () => {
    const msg = RED.createMessage({
      animation: fs.readFileSync(`${__dirname}/dummy/image.png`)
    }, 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    AnimationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'animation');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a sticker message with filename from config', () => {
    const msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      animation: `${__dirname}/dummy/file.mp4`
    });
    AnimationBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'animation');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

});
