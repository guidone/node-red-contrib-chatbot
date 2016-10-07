var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ContextBlock = require('../chatbot-context');

describe('Chat context node', function() {

  it('should get a context value', function () {
    var msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'get',
      fieldName: 'chatId'
    });
    RED.environment.chat(msg.originalMessage.chat.id, {
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload, 42);
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
  });

  it('should delete a context value', function () {
    var msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'delete',
      fieldName: 'chatId'
    });
    RED.environment.chat(msg.originalMessage.chat.id, {
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I am a useless message');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
    assert.equal(RED.node.context().chat.get('chatId'), undefined);
  });

  it('should set a context value string', function () {
    var msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'set',
      fieldName: 'myValue',
      fieldType: 'str',
      fieldValue: 'I am a string value'
    });
    RED.environment.chat(msg.originalMessage.chat.id, {
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I am a useless message');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
    assert.equal(RED.node.context().chat.get('myValue'), 'I am a string value');
  });

  it('should set a context number string', function () {
    var msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'set',
      fieldName: 'myValue',
      fieldType: 'num',
      fieldValue: '4242'
    });
    RED.environment.chat(msg.originalMessage.chat.id, {
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I am a useless message');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
    assert.equal(RED.node.context().chat.get('myValue'), 4242);
  });

  it('should set a context boolean string', function () {
    var msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'set',
      fieldName: 'myValue',
      fieldType: 'bol',
      fieldValue: 'true'
    });
    RED.environment.chat(msg.originalMessage.chat.id, {
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I am a useless message');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
    assert.equal(RED.node.context().chat.get('myValue'), true);
  });

  it('should set a context json string', function () {
    var msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'set',
      fieldName: 'myValue',
      fieldType: 'json',
      fieldValue: '{"key_1": 42, "key_2": "yes"}'
    });
    RED.environment.chat(msg.originalMessage.chat.id, {
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I am a useless message');
    assert.equal(RED.node.message().originalMessage.chat.id, 42);
    assert.equal(RED.node.context().chat.get('myValue').key_1, 42);
    assert.equal(RED.node.context().chat.get('myValue').key_2, 'yes');
  });

});
