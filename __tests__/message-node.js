const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const MessageBlock = require('../nodes/chatbot-message');

require('../lib/platforms/telegram');
require('../lib/platforms/slack');

describe('Chat message node', () => {

  it('should send the message in the config (telegram)', () => {
    const msg = RED.createMessage();
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

  it('should send the message in the config (slack)', () => {
    const msg = RED.createMessage(null, 'slack');
    RED.node.config({
      message: 'i am the message',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'i am the message');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.equal(RED.node.message().payload.inbound, false);
      });
  });

  it('should not send for an unknown platform', () => {
    const msg = RED.createMessage(null, 'unknown');
    RED.node.config({
      message: 'i am the message',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {
          // should fail
        },
        () => {
          assert.isNull(RED.node.message());
          assert.equal(RED.node.error(), 'Node "message" is not supported by unknown transport');
        });
  });

  it('should pass through the message if config message is empty', () => {
    const msg = RED.createMessage();
    RED.node.config({
      message: null,
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I am the original message');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.equal(RED.node.message().payload.inbound, false);
      });
  });

  it('should send a message using template', () => {
    const msg = RED.createMessage();
    RED.node.config({
      message: 'send message to {{name}} using template',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.context().flow.set('name', 'Guidone');
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'send message to Guidone using template');
        assert.equal(RED.node.message().payload.chatId, 42);
      });
  });

  it('should compose a message using user defined variable in context', () => {
    const msg = RED.createMessage();
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
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'The number is 24 snd the name is Javascript Jedi');
        assert.equal(RED.node.message().payload.chatId, 42);
      });
  });

  it('should convert a emojii in unicode', () => {
    const msg = RED.createMessage();
    RED.node.config({
      message: 'I :heart: :coffee:!',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I ❤️ ☕️!');
      });
  });

  it('should use {{payload}} with a number as input', () => {
    const msg = RED.createMessage(42);
    RED.node.config({
      message: 'There is a {{payload}} at the door',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'There is a 42 at the door');
      });
  });

  it('should use {{payload}} with a string as input', () => {
    const msg = RED.createMessage('42');
    RED.node.config({
      message: 'There is a {{payload}} at the door',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'There is a 42 at the door');
      });
  });

  it('should use {{payload}} with a object as input', () => {
    const msg = RED.createMessage({id: 42});
    RED.node.config({
      message: 'There is a {{payload}} at the door',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'There is a [object Object] at the door');
      });
  });

  it('should use {{payload}} with an array as input', () => {
    const msg = RED.createMessage([1,2,3]);
    RED.node.config({
      message: 'There is a {{payload}} at the door',
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'There is a 1,2,3 at the door');
      });
  });

  it('should send a message randomly picked from array', () => {
    const msg = RED.createMessage({});
    RED.node.config({
      message: [{message: 'Message 1'}, {message: 'Message 2'}, {message: 'Message 3'}],
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
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

  it('should send a message randomly picked from array passed as payload', () => {
    const msg = RED.createMessage(['Message 1', 'Message 2', 'Message 3']);
    RED.node.config({
      track: false,
      answer: false
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
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

  it('should send a message from payload even with the default value for message', () => {
    const msg = RED.createMessage('Test context for message');
    RED.node.config({
      message: [{message: ''}]
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'Test context for message');
      });
  });

  it('should send a message from payload even with an empty array of messages', () => {
    const msg = RED.createMessage('Test context for message');
    RED.node.config({
      message: [{message: ''}, {message: ''}, {message: ''}]
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'Test context for message');
      });
  });

  it('should get the "answer" key from payload', () => {
    const msg = RED.createMessage({ answer: 'I am an answer from dialogflow' });
    RED.node.config({
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I am an answer from dialogflow');
      });
  });

  it('take message from config even if there is a string at payload', () => {
    const msg = RED.createMessage('Should not send this');
    RED.node.config({
      message: [{message: 'I will send this'}]
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I will send this');
      });
  });

  it('message with defined language and same language in context, should pass', () => {
    const msg = RED.createMessage('Original message');
    RED.node.config({
      message: [{message: 'I will send this'}],
      language: 'it'
    });
    MessageBlock(RED);
    msg.chat().set('language', 'it');
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I will send this');
      });
  });

  it('message with defined language and different language in context, should not pass', () => {
    const msg = RED.createMessage('Original message');
    RED.node.config({
      message: [{message: 'I will send this'}],
      language: 'en '
    });
    MessageBlock(RED);
    msg.chat().set('language', 'it');
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload, 'Original message');
      });
  });

  it('message with defined language and undefined language in context, should pass', () => {
    const msg = RED.createMessage('Original message');
    RED.node.config({
      message: [{message: 'I will send this'}],
      language: 'it'
    });
    MessageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.content, 'I will send this');
      });
  });
  
});

