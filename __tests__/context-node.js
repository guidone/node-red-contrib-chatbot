const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const ContextBlock = require('../nodes/chatbot-context');

describe('Chat context node', () => {

  it('should get a context value', () => {
    const msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'get',
      fieldName: 'chatId'
    });
    msg.chat().set({
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload, 42);
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
      });
  });

  it('should delete a context value', () => {
    const msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'delete',
      fieldName: 'chatId'
    });
    msg.chat().set({
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I am a useless message');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
        assert.equal(msg.chat().get('chatId'), undefined);
      });
  });

  it('should set a context value string', () => {
    const msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'set',
      fieldName: 'myValue',
      fieldType: 'str',
      fieldValue: 'I am a string value'
    });
    msg.chat().set({
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I am a useless message');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
        assert.equal(msg.chat().get('myValue'), 'I am a string value');
      });
  });

  it('should set a context number string', () => {
    const msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'set',
      fieldName: 'myValue',
      fieldType: 'num',
      fieldValue: '4242'
    });
    msg.chat().set({
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I am a useless message');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
        assert.equal(msg.chat().get('myValue'), 4242);
      });
  });

  it('should set a context boolean string', () => {
    const msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'set',
      fieldName: 'myValue',
      fieldType: 'bool',
      fieldValue: 'true'
    });
    msg.chat().set({
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I am a useless message');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
        assert.equal(msg.chat().get('myValue'), true);
      });
  });

  it('should set a context json string', () => {
    const msg = RED.createMessage({content: 'I am a useless message'});
    RED.node.config({
      command: 'set',
      fieldName: 'myValue',
      fieldType: 'json',
      fieldValue: '{"key_1": 42, "key_2": "yes"}'
    });
    msg.chat().set({
      authorized: true,
      chatId: msg.originalMessage.chat.id
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I am a useless message');
        assert.equal(RED.node.message().originalMessage.chat.id, 42);
        assert.equal(msg.chat().get('myValue').key_1, 42);
        assert.equal(msg.chat().get('myValue').key_2, 'yes');
      });
  });

  it('should set variable of an intent', () => {
    const msg = RED.createMessage({
      type: 'intent',
      variables: {
        variable1: 'one',
        variable2: 42,
        variable3: true
      }
    });
    RED.node.config({
      command: 'intent'
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'intent');
        assert.isObject(RED.node.message().payload.variables);
        assert.equal(RED.node.message().payload.variables.variable1, 'one');
        assert.equal(RED.node.message().payload.variables.variable2, 42);
        assert.equal(RED.node.message().payload.variables.variable3, true);
        assert.equal(msg.chat().get('variable1'), 'one');
        assert.equal(msg.chat().get('variable2'), 42);
        assert.equal(msg.chat().get('variable3'), true);
      });
  });

  it('should set variable from a slack response', () => {
    const msg = RED.createMessage({
      type: 'response',
      content: {
        variable1: 'one',
        variable2: 42,
        variable3: true
      }
    });
    RED.node.config({
      command: 'intent'
    });
    ContextBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'response');
        assert.isObject(RED.node.message().payload.content);
        assert.equal(RED.node.message().payload.content.variable1, 'one');
        assert.equal(RED.node.message().payload.content.variable2, 42);
        assert.equal(RED.node.message().payload.content.variable3, true);
        assert.equal(msg.chat().get('variable1'), 'one');
        assert.equal(msg.chat().get('variable2'), 42);
        assert.equal(msg.chat().get('variable3'), true);
      });
  });

});
