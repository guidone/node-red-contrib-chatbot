var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var InlineButtonsBlock = require('../chatbot-inline-buttons');

describe('Chat inline buttons node', function() {

  it('should send inline buttons in Telegram', function () {
    var msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      message: 'message for the buttons',
      answers: [
        {
          value: 'value 1',
          label: 'Value 1',
          answer: null,
          alert: false
        },
        {
          value: 'value 2',
          label: 'Value 2',
          answer: 'the answer 2',
          alert: false
        },
        {
          value: 'value 3',
          label: 'Value 3',
          answer: 'the answer 3',
          alert: true
        }
      ]
    });
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.type, 'inline-buttons');
    assert.equal(RED.node.message().payload.content, 'message for the buttons');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.isArray(RED.node.message().payload.buttons);
    assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
    assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
    assert.equal(RED.node.message().payload.buttons[0].answer, null);
    assert.equal(RED.node.message().payload.buttons[0].alert, false);
    assert.equal(RED.node.message().payload.buttons[1].value, 'value 2');
    assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
    assert.equal(RED.node.message().payload.buttons[1].answer, 'the answer 2');
    assert.equal(RED.node.message().payload.buttons[1].alert, false);
    assert.equal(RED.node.message().payload.buttons[2].value, 'value 3');
    assert.equal(RED.node.message().payload.buttons[2].label, 'Value 3');
    assert.equal(RED.node.message().payload.buttons[2].answer, 'the answer 3');
    assert.equal(RED.node.message().payload.buttons[2].alert, true);

  });

  it('should send inline buttons in Telegram', function () {
    var msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      message: 'message for the buttons',
      answers: [
        {
          value: 'value 1',
          label: 'Value 1',
          answer: 'alert 1'
        },
        {
          label: 'Value 2',
          url: 'http://www.javascript-jedi.com'
        }
      ]
    });
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.type, 'inline-buttons');
    assert.equal(RED.node.message().payload.content, 'message for the buttons');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.isArray(RED.node.message().payload.buttons);
    assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
    assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
    assert.equal(RED.node.message().payload.buttons[0].answer, 'alert 1');
    assert.isUndefined(RED.node.message().payload.buttons[0].alert);
    assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
    assert.equal(RED.node.message().payload.buttons[1].url, 'http://www.javascript-jedi.com');
    assert.isUndefined(RED.node.message().payload.buttons[1].alert);


  });

  it('should send inline buttons in Facebook', function () {
    var msg = RED.createMessage({}, 'facebook');
    RED.node.config({
      message: 'message for the buttons',
      answers: [
        {
          value: 'value 1',
          label: 'Value 1',
          answer: null,
          alert: false
        },
        {
          value: 'value 2',
          label: 'Value 2',
          answer: 'the answer 2',
          alert: false
        },
        {
          value: 'value 3',
          label: 'Value 3',
          answer: 'the answer 3',
          alert: true
        }
      ]
    });
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.type, 'inline-buttons');
    assert.equal(RED.node.message().payload.content, 'message for the buttons');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.isArray(RED.node.message().payload.buttons);
    assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
    assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
    assert.equal(RED.node.message().payload.buttons[0].answer, null);
    assert.equal(RED.node.message().payload.buttons[0].alert, false);
    assert.equal(RED.node.message().payload.buttons[1].value, 'value 2');
    assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
    assert.equal(RED.node.message().payload.buttons[1].answer, 'the answer 2');
    assert.equal(RED.node.message().payload.buttons[1].alert, false);
    assert.equal(RED.node.message().payload.buttons[2].value, 'value 3');
    assert.equal(RED.node.message().payload.buttons[2].label, 'Value 3');
    assert.equal(RED.node.message().payload.buttons[2].answer, 'the answer 3');
    assert.equal(RED.node.message().payload.buttons[2].alert, true);

  });

  it('should send inline buttons in Smooch', function () {
    var msg = RED.createMessage({}, 'smooch');
    RED.node.config({
      message: 'message for the buttons',
      answers: [
        {
          value: 'value 1',
          label: 'Value 1',
          answer: null,
          alert: false
        },
        {
          value: 'value 2',
          label: 'Value 2',
          answer: 'the answer 2',
          alert: false
        },
        {
          value: 'value 3',
          label: 'Value 3',
          answer: 'the answer 3',
          alert: true
        }
      ]
    });
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.type, 'inline-buttons');
    assert.equal(RED.node.message().payload.content, 'message for the buttons');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.isArray(RED.node.message().payload.buttons);
    assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
    assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
    assert.equal(RED.node.message().payload.buttons[0].answer, null);
    assert.equal(RED.node.message().payload.buttons[0].alert, false);
    assert.equal(RED.node.message().payload.buttons[1].value, 'value 2');
    assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
    assert.equal(RED.node.message().payload.buttons[1].answer, 'the answer 2');
    assert.equal(RED.node.message().payload.buttons[1].alert, false);
    assert.equal(RED.node.message().payload.buttons[2].value, 'value 3');
    assert.equal(RED.node.message().payload.buttons[2].label, 'Value 3');
    assert.equal(RED.node.message().payload.buttons[2].answer, 'the answer 3');
    assert.equal(RED.node.message().payload.buttons[2].alert, true);

  });



  it('should not send inline buttons in Slack', function () {
    var msg = RED.createMessage({}, 'slack');
    RED.node.config({
      message: 'message for the buttons',
      answers: [
        {
          value: 'value 1',
          label: 'Value 1',
          answer: null,
          alert: false
        },
        {
          value: 'value 2',
          label: 'Value 2',
          answer: 'the answer 2',
          alert: false
        },
        {
          value: 'value 3',
          label: 'Value 3',
          answer: 'the answer 3',
          alert: true
        }
      ]
    });
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message(), null);
  });

});
