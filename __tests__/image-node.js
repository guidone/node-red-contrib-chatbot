const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const ImageBlock = require('../nodes/chatbot-image');
const fs = require('fs');

require('../lib/platforms/telegram');
require('../lib/platforms/facebook/facebook');

describe('Chat image node', () => {

  it('should send a image message with buffer from payload', () => {
    const msg = RED.createMessage(new Buffer('image'), 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'my file name test');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with buffer from payload and new chatId', () => {
    const msg = RED.createMessage(new Buffer('image'), 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    msg.originalMessage.chat = null;
    msg.originalMessage.chatId = 42;
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'my file name test');
        assert.equal(RED.node.message().originalMessage.chatId, 42);
      });
  });

  it('should send a image message with filename from payload', () => {
    const msg = RED.createMessage(__dirname + '/dummy/file.mp4', 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {},
        () => {
          assert.equal(RED.node.error(), 'Unsupported file format for image node "file.mp4", allowed formats: .jpg, .jpeg, .png, .gif');
        }
      );
  });

  it('should throw error for not supported file format', () => {
    const msg = RED.createMessage(__dirname + '/dummy/image.png', 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {},
        () => {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        }
      );
  });

  it('should send a image message with filename from payload (named parameter)', () => {
    const msg = RED.createMessage({
      image: __dirname + '/dummy/image.png',
      caption: 'just a caption'
    }, 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'image.png');
        assert.equal(RED.node.message().payload.caption, 'just a caption');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with buffer from payload (named parameter)', () => {
    const msg = RED.createMessage({
      image: fs.readFileSync(__dirname + '/dummy/image.png'),
      caption: 'just a caption'
    }, 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'my file name test');
        assert.equal(RED.node.message().payload.caption, 'just a caption');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with filename from config', () => {
    const msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      image: __dirname + '/dummy/image.png',
      caption: 'just a caption'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'image.png');
        assert.equal(RED.node.message().payload.caption, 'just a caption');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with filename from config (old parameter)', () => {
    const msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      caption: 'just a caption'
    });
    msg.filename = __dirname + '/dummy/image.png';
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'image.png');
        assert.equal(RED.node.message().payload.caption, 'just a caption');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with buffer from payload (input from http node)', () => {
    const msg = RED.createMessage(fs.readFileSync(__dirname + '/dummy/image.png'), 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'my file name test');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should warn if the user trying to send very large string (a http payload as string instead of buffer)', () => {
    const msg = RED.createMessage(fs.readFileSync(__dirname + '/dummy/image.png').toString(), 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {},
        error => {
          assert.include(error, 'Looks like you are passing a very long string');
        });
  });

  it('should send a local image file using chat context variables', () => {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      name: 'my file',
      image: '{{myfile}}',
      caption: '{{mycaption}} for {{myfile}}'
    });
    msg.chat().set({
      myfile: __dirname + '/dummy/image.png',
      mycaption: 'I am a caption'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'image.png');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send image appending upstream text message', async () => {
    const msg = RED.createRawMessage({
      message: 'message for the buttons',
      payload: {
        type: 'message',
        content: 'I am the previous message',
        chatId: 42,
        inbound: false
      }
    }, 'telegram');
    RED.node.config({
      name: 'my file',
      image: '{{myfile}}',
      caption: '{{mycaption}} for {{myfile}}'
    });
    msg.chat().set({
      myfile: __dirname + '/dummy/image.png',
      mycaption: 'I am a caption'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await();
    const response = RED.node.message().payload;

    assert.equal(response[0].type, 'message');
    assert.equal(response[0].chatId, 42);
    assert.equal(response[0].inbound, false);
    assert.equal(response[0].content, 'I am the previous message');
    assert.equal(response[1].type, 'photo');
    assert.equal(response[1].inbound, false);
    assert.instanceOf(response[1].content, Buffer);
    assert.equal(response[1].filename, 'image.png');
    assert.equal(response[1].chatId, 42);
  });

});
