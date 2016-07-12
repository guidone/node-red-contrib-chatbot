var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ParseBlock = require('../chatbot-parse');

describe('Chat parse node', function() {

  it('should parse an image into a buffer', function() {
    var msg = RED.createMessage({
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
    assert.instanceOf(RED.node.context().flow.get('photo'), Buffer);
    assert.equal(RED.node.context().flow.get('photo').toString(), 'image-bytecode');
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
    assert.equal(RED.node.context().flow.get('email'), 'guido.bellomo@gmail.com');
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




});

