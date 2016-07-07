var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var AuthorizedBlock = require('../chatbot-authorized');

describe('Chat authorized node', function() {

  it('should pass to the second output for unauthorized nodes', function () {
    var msg = RED.createMessage({content: 'I am the input message'});
    RED.node.config({
      command: 'start'
    });
    AuthorizedBlock(RED);
    RED.environment.chat(msg.originalMessage.chat.id, {authorized: false});
    RED.node.get().emit('input', msg);

    assert.equal(RED.node.message(0), null);
    assert.equal(RED.node.message(1).originalMessage.chat.id, 42);
    assert.equal(RED.node.message(1).payload.content, 'I am the input message');
  });

  it('should pass to the first output for authorized nodes', function () {
    var msg = RED.createMessage({content: 'I am the input message'});
    RED.node.config({
      command: 'start'
    });
    AuthorizedBlock(RED);
    RED.environment.chat(msg.originalMessage.chat.id, {authorized: true});
    RED.node.get().emit('input', msg);

    assert.equal(RED.node.message(0).originalMessage.chat.id, 42);
    assert.equal(RED.node.message(0).payload.content, 'I am the input message');
    assert.equal(RED.node.message(1), null);
  });



});
