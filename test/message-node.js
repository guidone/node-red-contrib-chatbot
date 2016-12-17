var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var MessageBlock = require('../chatbot-message');

describe('Chat message node', function() {

  it('should send the message in the config (telegram)', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'i am the message',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'i am the message');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.equal(RED.node.message().payload.inbound, false);
  });

  it('should send the message in the config (slack)', function() {
    var msg = RED.createMessage(null, 'slack');
    RED.node.config({
      message: 'i am the message',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'i am the message');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.equal(RED.node.message().payload.inbound, false);
  });

  it('should not send for an unknown platform', function() {
    var msg = RED.createMessage(null, 'unknown');
    RED.node.config({
      message: 'i am the message',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isNull(RED.node.message());
    assert.equal(RED.node.error(), 'This node is not available for transport: unknown');
  });

  it('should pass through the message if config message is empty', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: null,
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I am the original message');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.equal(RED.node.message().payload.inbound, false);
  });

  it('should answer to previous message', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: null,
      track: false,
      answer: true
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I am the original message');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.equal(RED.node.message().payload.options.reply_to_message_id, 72);
  });

  it('should send a message using template', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'send message to {{name}} using template',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.context().flow.set('name', 'Guidone');
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'send message to Guidone using template');
    assert.equal(RED.node.message().payload.chatId, 42);
  });

  it('should compose a message using user defined variable in context', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'The number is {{myvariable}} snd the name is {{myName}}',
      track: false,
      answer: false
    });
    RED.environment.chat(msg.originalMessage.chat.id, {
      authorized: true,
      chatId: msg.originalMessage.chat.id,
      myvariable: '24',
      myName: 'Javascript Jedi'
    });
    MessageBlock(RED);
    RED.node.context().flow.set('name', 'Guidone');
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'The number is 24 snd the name is Javascript Jedi');
    assert.equal(RED.node.message().payload.chatId, 42);
  });


  it('should send a message with markdown formatting', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'this is *bold*',
      track: false,
      answer: false,
      parse_mode: 'Markdown'
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'this is *bold*');
    assert.equal(RED.node.message().payload.options.parse_mode, 'Markdown');
  });

  it('should convert a emojii in unicode', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'I :heart: :coffee:!',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.content, 'I ❤️ ☕️!');
  });

});

