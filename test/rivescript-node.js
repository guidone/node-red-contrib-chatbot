var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var RiveScriptBlock = require('../chatbot-rivescript');

describe('Chat RiveScript node', function() {

  it('should answer to hello', function() {
    var msg = RED.createMessage({content: 'hello bot'});
    RED.node.config({
      script: '! version = 2.0\n\n+ hello bot\n- Hello, human!'
    });
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload, 'Hello, human!');
  });

  it('should not answer to useless sentence', function() {
    var msg = RED.createMessage({content: 'I have an headache'});
    RED.node.config({
      script: '! version = 2.0\n\n+ hello bot\n- Hello, human!'
    });
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message(), null);
    assert.equal(RED.node.message(1).payload.content, 'ERR: No Reply Matched');
  });

  it('should grab the name and store it', function() {
    var msg = RED.createMessage({content: 'my name is guido'});
    RED.node.config({
      script: '! version = 2.0\n\n+ my name is *\n- <set name=<formal>>ok, I will ll remember your name as <get name>'
    });
    RED.environment.chat(msg.originalMessage.chat.id, {});
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload, 'ok, I will ll remember your name as Guido');
    assert.equal(RED.node.context().chat.get('name'), 'Guido');
  });

  it('should remember the user name', function() {
    var msg = RED.createMessage({content: 'what is my name?'});
    RED.node.config({
      script: '! version = 2.0\n\n+ what is my name\n- your name is <get name>'
    });
    RED.environment.chat(msg.originalMessage.chat.id, {name: 'guido'});
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload, 'your name is guido');
    assert.equal(RED.node.context().chat.get('name'), 'guido');
  });

});

