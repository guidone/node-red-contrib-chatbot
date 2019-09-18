var fs = require('fs');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var VideoBlock = require('../nodes/chatbot-video');

require('../lib/platforms/telegram');
require('../lib/platforms/facebook/facebook');

describe('Chat video node', function() {

  it('should send a local mp4 file using chat context variables', () => {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      name: 'my file',
      video: '{{myfile}}',
      caption: '{{mycaption}} for {{myfile}}'
    });
    msg.chat().set({
      myfile: __dirname + '/dummy/file.mp4',
      mycaption: 'I am a caption'
    });
    VideoBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'video');
        assert.equal(RED.node.message().payload.mimeType, 'video/mp4');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a local mp4 file with filename parameter Telegram', () => {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      name: 'my file',
      video: __dirname + '/dummy/file.mp4'
    });
    VideoBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'video');
        assert.equal(RED.node.message().payload.mimeType, 'video/mp4');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a local mp4 vide with filename parameter in upstream node Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    msg.filename = __dirname + '/dummy/file.mp4';
    RED.node.config({});
    VideoBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'video');
        assert.equal(RED.node.message().payload.mimeType, 'video/mp4');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a local video file with a wrong filename parameter in upstream node Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    msg.filename = __dirname + '/dummy/file-wrong.mp4';
    RED.node.config({});
    VideoBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(
        () => {},
        () => {
          assert.include(RED.node.error(), 'Error opening file');
          assert.include(RED.node.error(), 'file-wrong.mp4');
        }
      );
  });

  it('should send a video with Telegram using name to get mime type', () => {
    const msg = RED.createMessage(fs.readFileSync(__dirname + '/dummy/file.mp4'), 'telegram');
    RED.node.config({
      name: 'my-file.mp4'
    });
    VideoBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'video');
        assert.equal(RED.node.message().payload.mimeType, 'video/mp4');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'my-file.mp4');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a video with Telegram from a RedBot file node', () => {
    const msg = RED.createMessage({
      video: fs.readFileSync(__dirname + '/dummy/file.mp4'),
      filename: '/dummy/file.mp4'
    }, 'telegram');
    RED.node.config({});
    VideoBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'video');
        assert.equal(RED.node.message().payload.mimeType, 'video/mp4');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a buffer document with Telegram without using name for mime type', () => {
    const msg = RED.createMessage(fs.readFileSync(__dirname + '/dummy/file.mp4'), 'telegram');
    RED.node.config({});
    VideoBlock(RED);

    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {},
        () => {
          assert.equal(RED.node.error(), 'Unknown file type, use the "name" parameter to specify the file name and extension as default');
        }
      );
  });

  it('should send a video from a file with Facebook', () => {
    const msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      name: 'my file',
      video: __dirname + '/dummy/file.mp4'
    });
    VideoBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'video');
        assert.equal(RED.node.message().payload.mimeType, 'video/mp4');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a video from a file with Facebook', () => {
    const msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      name: 'my file',
      video: __dirname + '/dummy/file.mp4'
    });
    VideoBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'video');
        assert.equal(RED.node.message().payload.mimeType, 'video/mp4');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send an unsupported video format from file with Facebook', function () {
    const msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      name: 'my file',
      video: __dirname + '/dummy/video.mov'
    });
    VideoBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(
        () => {},
        () => {
          assert.equal(RED.node.error(), 'Unsupported file format for video node "video.mov", allowed formats: .mp4');
        }
      );
  });

});
