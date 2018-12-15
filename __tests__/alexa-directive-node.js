var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var AlexaDirectiveBlock = require('../nodes/chatbot-alexa-directive');

describe('Chat alexa directive node', function() {

  it('should set a directive to delegate', function() {
    var msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      directiveType: 'Dialog.Delegate'
    });
    msg.chat().set('name', 'Guidone');
    AlexaDirectiveBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'directive');
        assert.equal(RED.node.message().payload.directiveType, 'Dialog.Delegate');
      });
  });

  it('should elicit a slot', function() {
    var msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      directiveType: 'Dialog.ElicitSlot',
      slot: 'a-slot'
    });
    msg.chat().set('name', 'Guidone');
    AlexaDirectiveBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'directive');
        assert.equal(RED.node.message().payload.directiveType, 'Dialog.ElicitSlot');
        assert.equal(RED.node.message().payload.slotToElicit, 'a-slot');
      });
  });

  it('should elicit a slot from payload', function() {
    var msg = RED.createMessage({
      directiveType: 'Dialog.ElicitSlot',
      slot: 'a-slot'
    }, 'alexa');
    RED.node.config({ });
    msg.chat().set('name', 'Guidone');
    AlexaDirectiveBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'directive');
        assert.equal(RED.node.message().payload.directiveType, 'Dialog.ElicitSlot');
        assert.equal(RED.node.message().payload.slotToElicit, 'a-slot');
      });
  });

  it('should confirm a slot', function() {
    var msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      directiveType: 'Dialog.ConfirmSlot',
      slot: 'a-slot'
    });
    msg.chat().set('name', 'Guidone');
    AlexaDirectiveBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function() {
        assert.equal(RED.node.message().payload.type, 'directive');
        assert.equal(RED.node.message().payload.directiveType, 'Dialog.ConfirmSlot');
        assert.equal(RED.node.message().payload.slotToConfirm, 'a-slot');
      });
  });



});

