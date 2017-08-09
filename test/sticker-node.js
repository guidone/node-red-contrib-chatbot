var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var StickerBlock = require('../chatbot-sticker');
var fs = require('fs');

describe('Chat image node', function() {

  it('should send a sticker message with buffer from payload', function () {
    var msg = RED.createMessage(new Buffer('image'), 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    StickerBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'sticker');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a sticker message with filename from payload', function () {
    var msg = RED.createMessage(__dirname + '/dummy/file.mp4', 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    StickerBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'sticker');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a sticker message with filename from payload (named parameter)', function () {
    var msg = RED.createMessage({
      sticker: __dirname + '/dummy/file.mp4'
    }, 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    StickerBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'sticker');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a sticker message with buffer from payload (named parameter)', function () {
    var msg = RED.createMessage({
      sticker: fs.readFileSync(__dirname + '/dummy/image.png')
    }, 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    StickerBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'sticker');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a sticker message with filename from config', function () {
    var msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      sticker: __dirname + '/dummy/file.mp4'
    });
    StickerBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'sticker');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

});
