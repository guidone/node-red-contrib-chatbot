
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const QuickRepliesBlock = require('../nodes/chatbot-quick-replies');

require('../lib/platforms/facebook/facebook');
require('../lib/platforms/telegram');

describe('Chat quick replies buttons', () => {

it('should send quick replies in facebook', () => {
    const msg = RED.createMessage({}, 'facebook');
    msg.chat().set('my_var', 'hello!')
    RED.node.config({
      message: 'message for the buttons',
      buttons: [
        {
          type: 'postback',
          value: 'value 1',
          label: 'Value 1',
          answer: null,
          alert: false
        },
        {
          type: 'postback',
          value: 'value 2',
          label: 'Value {{my_var}}',
          answer: null,
          alert: false
        },
      ]
    });
    QuickRepliesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'quick-replies');
        assert.equal(RED.node.message().payload.content, 'message for the buttons');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.buttons);
        assert.equal(RED.node.message().payload.buttons[0].type, 'postback');
        assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
        assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
        assert.equal(RED.node.message().payload.buttons[1].type, 'postback');
        assert.equal(RED.node.message().payload.buttons[1].label, 'Value hello!');
      });
  });

it('should send quick replies in facebook using payload', () => {
    const msg = RED.createMessage({
      message: 'message for the buttons',
      buttons: [
        {
          type: 'postback',
          value: 'value 1',
          label: 'Value 1',
          answer: null,
          alert: false
        },
        {
          type: 'postback',
          value: 'value 2',
          label: 'Value {{my_var}}',
          answer: null,
          alert: false
        },
      ]
    }, 'facebook');
    msg.chat().set('my_var', 'hello!')
    RED.node.config({});
    QuickRepliesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'quick-replies');
        assert.equal(RED.node.message().payload.content, 'message for the buttons');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.buttons);
        assert.equal(RED.node.message().payload.buttons[0].type, 'postback');
        assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
        assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
        assert.equal(RED.node.message().payload.buttons[1].type, 'postback');
        assert.equal(RED.node.message().payload.buttons[1].label, 'Value hello!');
      });
  });

  it('should not send quick replies in telegram', () => {
    const msg = RED.createMessage({}, 'telegram');
    msg.chat().set('my_var', 'hello!')
    RED.node.config({
      message: 'message for the buttons',
      buttons: [
        {
          type: 'postback',
          value: 'value 1',
          label: 'Value 1',
          answer: null,
          alert: false
        },
        {
          type: 'postback',
          value: 'value 2',
          label: 'Value {{my_var}}',
          answer: null,
          alert: false
        },
      ]
    });
    QuickRepliesBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {},
        e => {
          assert.equal(e, 'Node "quick-replies" is not supported by telegram transport');
        }  
      );
  });

});
