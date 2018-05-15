var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var MessageBlock = require('../nodes/chatbot-message');

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
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.content, 'i am the message');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.equal(RED.node.message().payload.inbound, false);
      });

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
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'i am the message');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.equal(RED.node.message().payload.inbound, false);
      });
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
    return RED.node.get().await()
      .then(
        function () {
          // should fail
        },
        function() {
          assert.isNull(RED.node.message());
          assert.equal(RED.node.error(), 'This node is not available for transport: unknown');
        });
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
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'I am the original message');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.equal(RED.node.message().payload.inbound, false);
      });
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
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'I am the original message');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.equal(RED.node.message().payload.options.reply_to_message_id, 72);
      });
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
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'send message to Guidone using template');
        assert.equal(RED.node.message().payload.chatId, 42);
      });
  });

  it('should compose a message using user defined variable in context', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: 'The number is {{myvariable}} snd the name is {{myName}}',
      track: false,
      answer: false
    });
    msg.chat().set({
      authorized: true,
      chatId: msg.originalMessage.chat.id,
      myvariable: '24',
      myName: 'Javascript Jedi'
    });
    MessageBlock(RED);
    RED.node.context().flow.set('name', 'Guidone');
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'The number is 24 snd the name is Javascript Jedi');
        assert.equal(RED.node.message().payload.chatId, 42);
      });
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
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'I ❤️ ☕️!');
      });
  });

  it('should use {{payload}} with a number as input', function() {
    var msg = RED.createMessage(42);
    RED.node.config({
      message: 'There is a {{payload}} at the door',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'There is a 42 at the door');
      });
  });

  it('should use {{payload}} with a string as input', function() {
    var msg = RED.createMessage('42');
    RED.node.config({
      message: 'There is a {{payload}} at the door',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'There is a 42 at the door');
      });
  });

  it('should use {{payload}} with a object as input', function() {
    var msg = RED.createMessage({id: 42});
    RED.node.config({
      message: 'There is a {{payload}} at the door',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'There is a [object Object] at the door');
      });
  });

  it('should use {{payload}} with an array as input', function() {
    var msg = RED.createMessage([1,2,3]);
    RED.node.config({
      message: 'There is a {{payload}} at the door',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'There is a 1,2,3 at the door');
      });
  });

  it('should send a message randomly picked from array', function() {
    var msg = RED.createMessage({});
    RED.node.config({
      message: [{message: 'Message 1'}, {message: 'Message 2'}, {message: 'Message 3'}],
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.oneOf(RED.node.message().payload.content, ['Message 1', 'Message 2', 'Message 3']);
      });
  });

  /*it('should have even distribution for a randomly picked message', function() {
    var msg = RED.createMessage();
    RED.node.config({
      message: [{message: 'Message 1'}, {message: 'Message 2'}, {message: 'Message 3'}],
      track: false,
      answer: false
    });
    MessageBlock(RED);
    // check distribution
    var stack = [];
    for(var idx = 0; idx < 1000; idx++) {
      RED.node.get().emit('input', msg);
      stack.push(RED.node.message().payload.content);
    }
    var stats = _.countBy(stack);

    assert.isAtLeast(stats['Message 1'], 290);
    assert.isAtMost(stats['Message 1'], 380);
    assert.isAtLeast(stats['Message 2'], 290);
    assert.isAtMost(stats['Message 2'], 380);
    assert.isAtLeast(stats['Message 3'], 290);
    assert.isAtMost(stats['Message 3'], 380);
  });*/

  it('should send a message randomly picked from array passed as payload', function() {
    var msg = RED.createMessage(['Message 1', 'Message 2', 'Message 3']);
    RED.node.config({
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.oneOf(RED.node.message().payload.content, ['Message 1', 'Message 2', 'Message 3']);
      });
  });

  /*it('should have even distribution for a randomly picked message passed as payload', function() {
    RED.node.config({
      track: false,
      answer: false
    });
    MessageBlock(RED);
    // check distribution
    var stack = [];
    for(var idx = 0; idx < 1000; idx++) {
      var msg = RED.createMessage(['Message 1', 'Message 2', 'Message 3']);
      RED.node.get().emit('input', msg);
      stack.push(RED.node.message().payload.content);
    }
    var stats = _.countBy(stack);

    assert.isAtLeast(stats['Message 1'], 280);
    assert.isAtMost(stats['Message 1'], 380);
    assert.isAtLeast(stats['Message 2'], 280);
    assert.isAtMost(stats['Message 2'], 380);
    assert.isAtLeast(stats['Message 3'], 280);
    assert.isAtMost(stats['Message 3'], 380);
  });*/

  it('should send a message from payload even with the default value for message', function() {
    var msg = RED.createMessage('Test context for message');
    RED.node.config({
      message: [{message: ''}]
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'Test context for message');
      });
  });

  it('should send a message from payload even with an empty array of messages', function() {
    var msg = RED.createMessage('Test context for message');
    RED.node.config({
      message: [{message: ''}, {message: ''}, {message: ''}]
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'Test context for message');
      });
  });

  it('should get the "answer" key from payload', function() {
    var msg = RED.createMessage({ answer: 'I am an answer from dialogflow' });
    RED.node.config({
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.content, 'I am an answer from dialogflow');
      });
  });

});

