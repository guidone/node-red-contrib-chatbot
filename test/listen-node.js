var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ListenBlock = require('../nodes/chatbot-listen');

describe('Chat listen node', function() {

  it('should detect the percentage before the raw number', function () {
    var msg = RED.createMessage({content: '100%'});
    RED.node.config({
      rules: [
        '[number]->tipPercentage,%[symbol]',
        '[number]->tip',
        '*'
      ]
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);

    assert.equal(RED.node.message(0).payload.content, '100%');
    assert.isNull(RED.node.message(1));
    assert.isNull(RED.node.message(2));
    assert.equal(msg.chat().get('tipPercentage'), 100);
  });

  it('should not try to parse a command-like message', function () {
    var msg = RED.createMessage({content: '/view'});
    RED.node.config({
      rules: [
        '[number]->tip',
        '*'
      ]
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
    assert.isNull(RED.node.message(1));
  });

  /*it('should detect a simple phrase send curriculum', function () {
    var msg = RED.createMessage({content: 'can you send your curriculum vitae'});
    RED.node.config({
      sentences: ['send,curriculum,vitae']
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'can you send your curriculum vitae');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
  });

  it('should detect a composed phrase send curriculum', function () {
    var msg = RED.createMessage({content: 'can you send your curriculum vitae'});
    RED.node.config({
      sentences: ['send,curriculum,vitae', 'send,curriculum']
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'can you send your curriculum vitae');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
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
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
    assert.equal(msg.chat().get('email'), 'guido.bellomo@gmail.com');
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
  });*/

});
