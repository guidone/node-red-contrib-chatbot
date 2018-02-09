var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var RiveScriptBlock = require('../nodes/chatbot-rivescript');
var utils = require('../lib/helpers/utils');
var when = utils.when;

describe('Chat RiveScript node', function() {

  it('should answer to hello', function() {
    var msg = RED.createMessage({content: 'hello bot'});
    RED.node.clear();
    RED.node.config({
      script: '! version = 2.0\n\n+ hello bot\n- Hello, human!'
    });
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload, 'Hello, human!');
      });
  });

  it('should not answer to useless sentence, pass thru message', function() {
    var msg = RED.createMessage({content: 'I have an headache'});
    RED.node.clear();
    RED.node.config({
      script: '! version = 2.0\n\n+ hello bot\n- Hello, human!'
    });
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message(), null);
        assert.equal(RED.node.message(1).payload.content, 'I have an headache');
      });
  });

  it('should answer with the default sentence', function() {
    var msg = RED.createMessage({content: 'I have an headache'});
    RED.node.clear();
    RED.node.config({
      script: '! version = 2.0\n\n+ hello bot\n- Hello, human!\n+ *\n- Did not understand'
    });
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message(0).payload, 'Did not understand');
        assert.isNull(RED.node.message(1));
      });
  });

  it('should not answer with the default sentence for command-like sentences', function() {
    var msg = RED.createMessage({content: '/cmd'});
    RED.node.clear();
    RED.node.config({
      script: '! version = 2.0\n\n+ hello bot\n- Hello, human!\n+ *\n- Did not understand'
    });
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        function() {},
        function () {
          assert.isNull(RED.node.message(0));
          assert.isNull(RED.node.message(1));
        }
      );
  });

  it('should grab the name and store it', function() {
    var msg = RED.createMessage({content: 'my name is guido'});
    RED.node.clear();
    RED.node.config({
      script: '! version = 2.0\n\n+ my name is *\n- <set name=<formal>>ok, I will ll remember your name as <get name>'
    });
    //RED.environment.chat(msg.originalMessage.chat.id, {});
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload, 'ok, I will ll remember your name as Guido');
        assert.equal(RED.node.message().chat().get('name'), 'Guido');
      });
  });

  it('should remember the user name', function() {
    var msg = RED.createMessage({content: 'what is my name?'});
    RED.node.clear();
    RED.node.config({
      script: '! version = 2.0\n\n+ what is my name\n- your name is <get name>'
    });
    msg.chat().set({name: 'guido'});
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload, 'your name is guido');
        return when(msg.chat().get('name'))
      })
      .then(function (name) {
        assert.equal(name, 'guido');
      });
  });

  it('should follow up the discussion', function() {
    var msg = RED.createMessage({content: 'i have a dog!'});
    RED.node.clear();
    RED.node.config({
      script: '! version = 2.0\n\n+ i have a dog\n- What color is it?\n\n'
        + '+ (red|blue)\n% what color is it\n- That\'s a silly color for a dog!\n'
    });
    msg.chat().set({name: 'guido'});
    RiveScriptBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload, 'What color is it?');
        var followup = RED.createMessage({content: 'red'});
        RED.node.get().emit('input', followup);
        return RED.node.get().await()
      })
      .then(function() {
        assert.equal(RED.node.message().payload, 'That\'s a silly color for a dog!');
      });
  });


  /*
   ! version = 2.0

   + i have a dog
   - What color is it?

   + (red|blue)
   % what color is it
   - That's a silly color for a dog!

   */
});

