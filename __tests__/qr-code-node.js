var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var QRCodeBlock = require('../nodes/chatbot-qrcode');

describe('Chat qr node', function() {

  it('should create a qr code from a message', function () {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'this text will be encoded'
    });
    QRCodeBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });

  });

  it('should create a qr code from a message from upstream node', function () {
    var msg = RED.createMessage('this text will be encoded');
    RED.node.config({});
    QRCodeBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'photo');
        assert.equal(RED.node.message().payload.inbound, false);
        assert.instanceOf(RED.node.message().payload.content, Buffer);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

});
