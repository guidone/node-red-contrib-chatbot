var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var TransportBlock = require('../chatbot-transport');

describe('Chat transport node', function() {

  it('should pass through telegram messages in 1 and 3', function() {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      rules: [
        {transport: 'telegram'},
        {transport: 'facebook'},
        {transport: 'telegram'}
      ]
    });
    TransportBlock(RED);
    RED.node.get().emit('input', msg);

    assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
    assert.equal(RED.node.message(0).originalMessage.transport, 'telegram');
    assert.isNull(RED.node.message(1));
    assert.equal(RED.node.message(2).originalMessage.chat.id, '42');
    assert.equal(RED.node.message(2).originalMessage.transport, 'telegram');
  });

  it('should pass through facebook messages in 2', function() {
    var msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      rules: [
        {transport: 'telegram'},
        {transport: 'facebook'},
        {transport: 'telegram'}
      ]
    });
    TransportBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
    assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
    assert.equal(RED.node.message(1).originalMessage.transport, 'facebook');
    assert.isNull(RED.node.message(2));
  });


  it('should pass nothing if no rules', function() {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      rules: [
      ]
    });
    TransportBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
  });

});

