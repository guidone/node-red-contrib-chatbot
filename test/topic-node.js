var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var TopicBlock = require('../nodes/chatbot-topic');

describe('Chat topic node', function() {

  it('should pass through in 1 if topic is ask_name, stops at first', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        {topic: 'ask_email'},
        {topic: 'ask_name'},
        {topic: ''},
        {topic: 'ask_name'}
      ]
    });
    TopicBlock(RED);
    RED.environment.chat(msg.originalMessage.chat.id, {
      chatId: msg.originalMessage.chat.id,
      topic: 'ask_name'
    });
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
    assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
    assert.isNull(RED.node.message(2));
    assert.isNull(RED.node.message(3));
  });

  it('should pass through in 3 if topic is *', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        {topic: 'ask_email'},
        {topic: 'ask_name'},
        {topic: '*'},
        {topic: 'ask_name'}
      ]
    });
    TopicBlock(RED);
    RED.environment.chat(msg.originalMessage.chat.id, {
      chatId: msg.originalMessage.chat.id
    });
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
    assert.isNull(RED.node.message(1));
    assert.equal(RED.node.message(2).originalMessage.chat.id, '42');
    assert.isNull(RED.node.message(3));
  });


  it('should pass nothing if no rules', function() {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      rules: [
      ]
    });
    TopicBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
  });

  it('should pass through in 1 then 2 and 3', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        {topic: 'ask_email'},
        {topic: 'ask_name'},
        {topic: ''},
        {topic: 'ask_name'}
      ]
    });
    TopicBlock(RED);
    RED.environment.chat(msg.originalMessage.chat.id, {
      chatId: msg.originalMessage.chat.id,
      topic: 'ask_email'
    });
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
    assert.isNull(RED.node.message(1));
    assert.isNull(RED.node.message(2));
    assert.isNull(RED.node.message(3));

    var msg2 = RED.createMessage(null);
    msg.chat().set('topic', 'ask_name');
    RED.node.get().emit('input', msg2);
    assert.isNull(RED.node.message(0));
    assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
    assert.isNull(RED.node.message(2));
    assert.isNull(RED.node.message(3));

  });

  it('should pass through in 1 and 2 if topic if topic has comma delimited string', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        {topic: 'ask_email,ask_name'},
        {topic: 'ask_name,ask_email'},
        {topic: ''},
        {topic: 'dont_know'}
      ]
    });
    TopicBlock(RED);
    RED.environment.chat(msg.originalMessage.chat.id, {
      chatId: msg.originalMessage.chat.id,
      topic: 'ask_name'
    });
    RED.node.get().emit('input', msg);

    assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
    assert.isNull(RED.node.message(1));
    assert.isNull(RED.node.message(2));
    assert.isNull(RED.node.message(3));

  });

});

