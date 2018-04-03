var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var ParseBlock = require('../nodes/chatbot-parse');
var moment = require('moment');

describe('Chat parse node', function() {

  it('should parse an image into a buffer', function() {
    var msg = RED.createMessage({
      type: 'photo',
      content: new Buffer('image-bytecode')
    });
    RED.node.config({
      parseType: 'photo',
      parseVariable: 'photo'
    });
    ParseBlock(RED);
    RED.node.get().emit('input', msg);
    assert.instanceOf(RED.node.message().payload, Buffer);
    assert.equal(RED.node.message().payload.toString(), 'image-bytecode');
    var chat = msg.chat();
    assert.instanceOf(chat.get('photo'), Buffer);
    assert.equal(chat.get('photo').toString(), 'image-bytecode');
  });

  it('should parse an image into a buffer without saving in the context', function() {
    var msg = RED.createMessage({
      type: 'photo',
      content: new Buffer('image-bytecode')
    });
    RED.node.config({
      parseType: 'photo',
      parseVariable: ''
    });
    ParseBlock(RED);
    RED.node.get().emit('input', msg);
    assert.instanceOf(RED.node.message().payload, Buffer);
    assert.equal(RED.node.message().payload.toString(), 'image-bytecode');
    var chat = msg.chat();
    assert.isNull(chat.get(''));
  });

  it('should not parse an image without type', function() {
    var msg = RED.createMessage({
      content: new Buffer('image-bytecode')
    });
    RED.node.config({
      parseType: 'photo',
      parseVariable: 'photo'
    });
    ParseBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isNull(RED.node.message(0));
    assert.isObject(RED.node.message(1).payload);
  });

  it('should parse an email into the payload', function() {
    var msg = RED.createMessage({
      content: 'my email is guido.bellomo@gmail.com'
    });
    RED.node.config({
      parseType: 'email',
      parseVariable: 'email'
    });
    ParseBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload, 'guido.bellomo@gmail.com');
    assert.equal(msg.chat().get('email'), 'guido.bellomo@gmail.com');
  });

  it('should not parse an invalid email into the payload', function() {
    var msg = RED.createMessage({
      content: 'my email is guido.bellomoATgmail.com'
    });
    RED.node.config({
      parseType: 'email',
      parseVariable: 'email'
    });
    ParseBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message(), null);
    assert.equal(RED.node.message(1).payload.content, 'my email is guido.bellomoATgmail.com');
  });

  it('should parse an integer number', function() {
    var msg = RED.createMessage({
      content: '42'
    });
    RED.node.config({
      parseType: 'number-integer',
      parseVariable: 'number'
    });
    ParseBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message(0).payload, 42);
    assert.isNull(RED.node.message(1));
  });

  it('should parse number written in plain english', function() {
    var msg = RED.createMessage({
      content: 'forty two'
    });
    RED.node.config({
      parseType: 'number-integer',
      parseVariable: 'number'
    });
    ParseBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message(0).payload, 42);
    assert.isNull(RED.node.message(1));
  });

  it('should parse a date', function() {
    var msg = RED.createMessage({
      content: '2/19/2017'
    });
    RED.node.config({
      parseType: 'date',
      parseVariable: 'date'
    });
    ParseBlock(RED);
    RED.node.get().emit('input', msg);
    assert.instanceOf(RED.node.message(0).payload, Date);

    var d = moment(RED.node.message(0).payload);
    assert.equal(d.get('year'), 2017);
    assert.equal(d.get('month'), 1);
    assert.equal(d.get('date'), 19);
  });

});

