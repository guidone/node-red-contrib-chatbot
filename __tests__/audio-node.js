const fs = require('fs');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const AudioBlock = require('../nodes/chatbot-audio');

require('../lib/platforms/telegram');
require('../lib/platforms/facebook/facebook');

describe('Chat audio node', () => {

  it('should send a local mp3 file with filename parameter Telegram using context variables', () => {
    const msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      name: 'my file',
      audio: '{{myfile}}',
      caption: '{{mycaption}} for {{myfile}}'
    });
    msg.chat().set({
      myfile: __dirname + '/dummy/audio.mp3',
      mycaption: 'I am a caption'
    });
    AudioBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'audio');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.include(RED.node.message().payload.caption, 'I am a caption for');
        assert.include(RED.node.message().payload.caption, '__tests__/dummy/audio.mp3');
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'audio.mp3');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a local mp3 file with filename parameter Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      name: 'my file',
      audio: __dirname + '/dummy/audio.mp3'
    });
    AudioBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'audio');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'audio.mp3');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a local mp3 audio with filename parameter in upstream node Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    msg.filename = __dirname + '/dummy/audio.mp3';
    RED.node.config({});
    AudioBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'audio');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.equal(RED.node.message().payload.filename, 'audio.mp3');
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a local audio file with a wrong filename parameter in upstream node Telegram', () => {
    const msg = RED.createMessage(null, 'telegram');
    msg.filename = __dirname + '/dummy/file-wrong.mp4';
    RED.node.config({});
    AudioBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(
        () => {},
        () => {
          assert.include(RED.node.error(), 'Error opening file');
          assert.include(RED.node.error(), '__tests__/dummy/file-wrong.mp4');
          assert.include(RED.node.error(), 'file-wrong.mp4');
        }
      );
  });


  it('should send an audio with Telegram using name for mime type', () => {
    const msg = RED.createMessage(fs.readFileSync(__dirname + '/dummy/audio.mp3'), 'telegram');
    RED.node.config({
      name: 'my-file.mp3'
    });
    AudioBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'audio');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'my-file.mp3');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send an audio with Telegram from a RedBot file node', () => {
    const msg = RED.createMessage({
      audio: fs.readFileSync(__dirname + '/dummy/audio.mp3'),
      filename: '/dummy/file.mp3'
    }, 'telegram');
    RED.node.config({});
    AudioBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'audio');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp3');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a buffer document with Telegram without using name for mime type', () => {
    const msg = RED.createMessage(fs.readFileSync(__dirname + '/dummy/audio.mp3'), 'telegram');
    RED.node.config({});
    AudioBlock(RED);

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
      audio: __dirname + '/dummy/audio.mp3'
    });
    AudioBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'audio');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'audio.mp3');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a video from a file with Facebook', () => {
    const msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      name: 'my file',
      audio: __dirname + '/dummy/audio.mp3'
    });
    AudioBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'audio');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'audio.mp3');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send an unsupported video format from file with Facebook', () => {
    const msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      name: 'my file',
      audio: __dirname + '/dummy/video.mov'
    });
    AudioBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(
        () => {},
        () => {
          assert.equal(RED.node.error(), 'Unsupported file format for audio node "video.mov", allowed formats: .mp3');
        }
      );
  });

});
