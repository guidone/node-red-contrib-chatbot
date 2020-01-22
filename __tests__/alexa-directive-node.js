const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const AlexaDirectiveBlock = require('../nodes/chatbot-alexa-directive');

require('../lib/platforms/alexa');

describe('Chat alexa directive node', () => {

  it('should set a directive to delegate', () => {
    const msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      directiveType: 'Dialog.Delegate'
    });
    msg.chat().set('name', 'Guidone');
    AlexaDirectiveBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'directive');
        assert.equal(RED.node.message().payload.directiveType, 'Dialog.Delegate');
      });
  });

  it('should elicit a slot', () => {
    const msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      directiveType: 'Dialog.ElicitSlot',
      slot: 'a-slot'
    });
    msg.chat().set('name', 'Guidone');
    AlexaDirectiveBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'directive');
        assert.equal(RED.node.message().payload.directiveType, 'Dialog.ElicitSlot');
        assert.equal(RED.node.message().payload.slotToElicit, 'a-slot');
      });
  });

  it('should elicit a slot from payload', () => {
    const msg = RED.createMessage({
      directiveType: 'Dialog.ElicitSlot',
      slot: 'a-slot'
    }, 'alexa');
    RED.node.config({ });
    msg.chat().set('name', 'Guidone');
    AlexaDirectiveBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'directive');
        assert.equal(RED.node.message().payload.directiveType, 'Dialog.ElicitSlot');
        assert.equal(RED.node.message().payload.slotToElicit, 'a-slot');
      });
  });

  it('should confirm a slot', () => {
    const msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      directiveType: 'Dialog.ConfirmSlot',
      slot: 'a-slot'
    });
    msg.chat().set('name', 'Guidone');
    AlexaDirectiveBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'directive');
        assert.equal(RED.node.message().payload.directiveType, 'Dialog.ConfirmSlot');
        assert.equal(RED.node.message().payload.slotToConfirm, 'a-slot');
      });
  });

});

