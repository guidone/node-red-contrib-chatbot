var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var RulesBlock = require('../nodes/chatbot-rules');

describe('Chat rules node', function() {

  it('should match goes through the first if the topic is null', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isTopicEmpty' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should go with the second if the topic is not null', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isTopicEmpty' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'a_topic '});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the variable my_var is null', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'hasNotVariable', variable: 'my_var' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the variable my_var has a value', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'hasNotVariable', variable: 'my_var' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ my_var: 'something '});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the topic is different than my_topic', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isNotTopic', topic: 'my_topic' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'another_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the topic is my_topic', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isNotTopic', topic: 'my_topic' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'my_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the topic is equal to my_topic', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isTopic', topic: 'my_topic' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'my_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the topic is not my_topic', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'isTopic', topic: 'my_topic' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ topic: 'another_topic' });
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is inbound', function() {
    var msg = RED.createMessage({inbound: true});
    RED.node.config({
      rules: [
        { type: 'inbound' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is outbound', function() {
    var msg = RED.createMessage({inbound: false});
    RED.node.config({
      rules: [
        { type: 'outbound' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is outbound but with rules in payload', function() {
    var msg = RED.createMessage({
      inbound: false,
      rules: [
        { type: 'outbound' },
        { type: 'catchAll' }
      ]
    });
    RED.node.config({});
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the variable my_var is not null', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'hasVariable', variable: 'my_var' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    msg.chat().set({ my_var: 'something '});
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the variable my_var has not a value', function() {
    var msg = RED.createMessage(null);
    RED.node.config({
      rules: [
        { type: 'hasVariable', variable: 'my_var' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);
    msg.chat().set({});
    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the first if the message is the command /my_command', function() {
    var msg = RED.createMessage({
      content: '/my_command'
    });
    RED.node.config({
      rules: [
        { type: 'command', command: '/my_command' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(1));
        assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
      });
  });

  it('should match goes through the second if the message is not the command /my_command', function() {
    var msg = RED.createMessage({
      content: 'a simple message'
    });
    RED.node.config({
      rules: [
        { type: 'command', command: '/my_command' },
        { type: 'catchAll' }
      ]
    });
    RulesBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        assert.isNull(RED.node.message(0));
        assert.equal(RED.node.message(1).originalMessage.chat.id, '42');
      });
  });

});

