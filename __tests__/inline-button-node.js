var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var InlineButtonsBlock = require('../nodes/chatbot-inline-buttons');

describe('Chat inline buttons node', function() {

  it('should send inline buttons in Telegram', function () {

    var msg = RED.createMessage({}, 'telegram');
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
          type: 'url',
          url: 'http://javascript-jedi.com',
          label: 'Value 2'
        },
        {
          type: 'call',
          value: '+39347123456',
          label: 'Call me'
        }
      ]
    });
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'inline-buttons');
        assert.equal(RED.node.message().payload.content, 'message for the buttons');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.buttons);
        assert.equal(RED.node.message().payload.buttons[0].type, 'postback');
        assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
        assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
        assert.equal(RED.node.message().payload.buttons[1].type, 'url');
        assert.equal(RED.node.message().payload.buttons[1].url, 'http://javascript-jedi.com');
        assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
        assert.equal(RED.node.message().payload.buttons[2].type, 'call');
        assert.equal(RED.node.message().payload.buttons[2].value, '+39347123456');
        assert.equal(RED.node.message().payload.buttons[2].label, 'Call me');
      });
  });


  it('should send inline buttons in Facebook', function () {
    var msg = RED.createMessage({}, 'facebook');
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
          type: 'url',
          url: 'http://javascript-jedi.com',
          label: 'Value 2'
        },
        {
          type: 'call',
          value: '+39347123456',
          label: 'Call me'
        }
      ]
    });
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'inline-buttons');
        assert.equal(RED.node.message().payload.content, 'message for the buttons');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.buttons);
        assert.equal(RED.node.message().payload.buttons[0].type, 'postback');
        assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
        assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
        assert.equal(RED.node.message().payload.buttons[1].type, 'url');
        assert.equal(RED.node.message().payload.buttons[1].url, 'http://javascript-jedi.com');
        assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
        assert.equal(RED.node.message().payload.buttons[2].type, 'call');
        assert.equal(RED.node.message().payload.buttons[2].value, '+39347123456');
        assert.equal(RED.node.message().payload.buttons[2].label, 'Call me');
      });

  });

  /*it('should send inline buttons in Smooch', function () {
    var msg = RED.createMessage({}, 'smooch');
    RED.node.config({
      message: 'message for the buttons',
      buttons: [
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
  });*/

  it('should not send inline buttons in Telegram, everything from upstream node', function () {

    var msg = RED.createMessage({
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
          type: 'url',
          url: 'http://javascript-jedi.com',
          label: 'Value 2'
        },
        {
          type: 'call',
          value: '+39347123456',
          label: 'Call me'
        }
      ]
    }, 'telegram');
    RED.node.config({});
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'inline-buttons');
        assert.equal(RED.node.message().payload.content, 'message for the buttons');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.buttons);
        assert.equal(RED.node.message().payload.buttons[0].type, 'postback');
        assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
        assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
        assert.equal(RED.node.message().payload.buttons[1].type, 'url');
        assert.equal(RED.node.message().payload.buttons[1].url, 'http://javascript-jedi.com');
        assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
        assert.equal(RED.node.message().payload.buttons[2].type, 'call');
        assert.equal(RED.node.message().payload.buttons[2].value, '+39347123456');
        assert.equal(RED.node.message().payload.buttons[2].label, 'Call me');
      });
  });

  it('should send inline buttons in Telegram, buttons from upstream node', function () {

    var msg = RED.createMessage([
        {
          type: 'postback',
          value: 'value 1',
          label: 'Value 1',
          answer: null,
          alert: false
        },
        {
          type: 'url',
          url: 'http://javascript-jedi.com',
          label: 'Value 2'
        },
        {
          type: 'call',
          value: '+39347123456',
          label: 'Call me'
        }
      ], 'telegram');
    RED.node.config({
      message: 'message for the buttons'
    });
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'inline-buttons');
        assert.equal(RED.node.message().payload.content, 'message for the buttons');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.buttons);
        assert.equal(RED.node.message().payload.buttons[0].type, 'postback');
        assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
        assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
        assert.equal(RED.node.message().payload.buttons[1].type, 'url');
        assert.equal(RED.node.message().payload.buttons[1].url, 'http://javascript-jedi.com');
        assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
        assert.equal(RED.node.message().payload.buttons[2].type, 'call');
        assert.equal(RED.node.message().payload.buttons[2].value, '+39347123456');
        assert.equal(RED.node.message().payload.buttons[2].label, 'Call me');
      });

  });

  it('should send inline buttons in Telegram, message from upstream node', function () {

    var msg = RED.createMessage('message for the buttons', 'telegram');
    RED.node.config({
      buttons: [
        {
          type: 'postback',
          value: 'value 1',
          label: 'Value 1',
          answer: null,
          alert: false
        },
        {
          type: 'url',
          url: 'http://javascript-jedi.com',
          label: 'Value 2'
        },
        {
          type: 'call',
          value: '+39347123456',
          label: 'Call me'
        }
      ]
    });
    InlineButtonsBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'inline-buttons');
        assert.equal(RED.node.message().payload.content, 'message for the buttons');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.buttons);
        assert.equal(RED.node.message().payload.buttons[0].type, 'postback');
        assert.equal(RED.node.message().payload.buttons[0].value, 'value 1');
        assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
        assert.equal(RED.node.message().payload.buttons[1].type, 'url');
        assert.equal(RED.node.message().payload.buttons[1].url, 'http://javascript-jedi.com');
        assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
        assert.equal(RED.node.message().payload.buttons[2].type, 'call');
        assert.equal(RED.node.message().payload.buttons[2].value, '+39347123456');
        assert.equal(RED.node.message().payload.buttons[2].label, 'Call me');
      });

  });

});
