var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ImageBlock = require('../nodes/chatbot-image');
var fs = require('fs');

describe('Chat image node', function() {

  it('should send a image message with buffer from payload', function () {
    var msg = RED.createMessage(new Buffer('image'), 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'my file name test');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with filename from payload', function () {
    var msg = RED.createMessage(__dirname + '/dummy/file.mp4', 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with filename from payload (named parameter)', function () {
    var msg = RED.createMessage({
      image: __dirname + '/dummy/file.mp4',
      caption: 'just a caption'
    }, 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().payload.caption, 'just a caption');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with buffer from payload (named parameter)', function () {
    var msg = RED.createMessage({
      image: fs.readFileSync(__dirname + '/dummy/image.png'),
      caption: 'just a caption'
    }, 'telegram');
    RED.node.config({
      name: 'my file name: test'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'my file name test');
        assert.equal(RED.node.message().payload.caption, 'just a caption');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with filename from config', function () {
    var msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      image: __dirname + '/dummy/file.mp4',
      caption: 'just a caption'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().payload.caption, 'just a caption');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should send a image message with filename from config (old parameter)', function () {
    var msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      filename: __dirname + '/dummy/file.mp4',
      caption: 'just a caption'
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().payload.filename, 'file.mp4');
        assert.equal(RED.node.message().payload.caption, 'just a caption');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

});
