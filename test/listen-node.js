var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ListenBlock = require('../chatbot-listen');

describe('Chat listen node', function() {

  it('should detect a simple phrase send curriculum', function () {
    var msg = RED.createMessage({content: 'can you send your curriculum vitae'});
    RED.node.config({
      sentences: ['send,curriculum,vitae']
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'can you send your curriculum vitae');
    assert.equal(RED.node.message(1).originalMessage.chat.id, 42);
  });

  it('should detect a composed phrase send curriculum', function () {
    var msg = RED.createMessage({content: 'can you send your curriculum vitae'});
    RED.node.config({
      sentences: ['send,curriculum,vitae', 'send,curriculum']
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'can you send your curriculum vitae');
    assert.equal(RED.node.message(1).originalMessage.chat.id, 42);
  });

  it('should not detect a composed phrase send curriculum', function () {
    var msg = RED.createMessage({content: 'can you send your cv'});
    RED.node.config({
      sentences: ['send,curriculum,vitae', 'send,curriculum']
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message(), null);
  });

  it('should detect a composed phrase send curriculum and extract email', function () {
    var msg = RED.createMessage({content: 'can you send your curriculum vitae to guido.bellomo@gmail.com'});
    RED.node.config({
      sentences: ['send,curriculum,vitae,{{email}}', 'send,curriculum,{{email}}']
    });
    RED.environment.chat(msg.originalMessage.chat.id, {authorized: true});
    ListenBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'can you send your curriculum vitae to guido.bellomo@gmail.com');
    assert.equal(RED.node.message(1).originalMessage.chat.id, 42);
    assert.equal(RED.node.context().chat.get('email'), 'guido.bellomo@gmail.com');
  });

  it('should NOT detect a composed phrase send curriculum and extract email', function () {
    var msg = RED.createMessage({content: 'can you send your curriculum vitae to guido.bellomoATgmail.com'});
    RED.node.config({
      sentences: ['send,curriculum,vitae,{{email}}', 'send,curriculum,{{email}}']
    });
    RED.environment.chat(msg.originalMessage.chat.id, {authorized: true});
    ListenBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message(), null);
  });

});
