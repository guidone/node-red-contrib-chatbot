var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ImageBlock = require('../chatbot-image');

describe('Chat image node', function() {

  it('should send a image message from payload', function () {
    var msg = RED.createMessage('<image-binary>');
    RED.node.config({
    });
    ImageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.type, 'photo');
    assert.equal(RED.node.message().payload.inbound, false);
    assert.equal(RED.node.message().payload.content, '<image-binary>');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
  });

});
