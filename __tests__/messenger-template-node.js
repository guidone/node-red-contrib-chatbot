const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const MessengerTemplateBlock = require('../nodes/chatbot-messenger-template');

require('../lib/platforms/facebook/facebook');

describe('Chat generic template node', () => {

  it('should not pass through with Telegram', () => {
    const msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      title: 'message for the template',
      templateType: 'generic',
      subtitle: 'I am a subtitle',
      imageUrl: 'http://the.image.png',
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
    MessengerTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        function() {},
        function () {
          assert.isNull(RED.node.message());
        }
      );
  });

  it('should create a generic template with Facebook', () => {
    const msg = RED.createMessage({}, 'facebook');
    RED.node.config({
      templateType: 'generic',
      title: 'message for the template',
      subtitle: 'I am a subtitle',
      imageUrl: 'http://the.image.png',
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
    MessengerTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const payload = RED.node.message().payload;
        assert.equal(payload.type, 'template');
        assert.equal(payload.templateType, 'generic');
        assert.equal(payload.chatId, 42);
        assert.isArray(payload.elements);
        assert.lengthOf(payload.elements, 1);
        assert.equal(payload.elements[0].title, 'message for the template');
        assert.equal(payload.elements[0].subtitle, 'I am a subtitle');
        assert.equal(payload.elements[0].imageUrl, 'http://the.image.png');
        assert.isArray(payload.elements[0].buttons);
        assert.lengthOf(payload.elements[0].buttons, 3);
        const buttons = payload.elements[0].buttons;
        assert.equal(buttons[0].type, 'postback');
        assert.equal(buttons[0].value, 'value 1');
        assert.equal(buttons[0].label, 'Value 1');
        assert.equal(buttons[1].type, 'url');
        assert.equal(buttons[1].url, 'http://javascript-jedi.com');
        assert.equal(buttons[1].label, 'Value 2');
        assert.equal(buttons[2].type, 'call');
        assert.equal(buttons[2].value, '+39347123456');
        assert.equal(buttons[2].label, 'Call me');
      });
  });

  it('should create a generic template with Facebook passing the buttons as payload in upstream node', () => {
    const msg = RED.createMessage([
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
    ], 'facebook');
    RED.node.config({
      templateType: 'generic',
      title: 'message for the template',
      subtitle: 'I am a subtitle',
      imageUrl: 'http://the.image.png'
    });
    MessengerTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const payload = RED.node.message().payload;
        assert.equal(payload.type, 'template');
        assert.equal(payload.templateType, 'generic');
        assert.equal(payload.chatId, 42);
        assert.isArray(payload.elements);
        assert.lengthOf(payload.elements, 1);
        assert.equal(payload.elements[0].title, 'message for the template');
        assert.equal(payload.elements[0].subtitle, 'I am a subtitle');
        assert.equal(payload.elements[0].imageUrl, 'http://the.image.png');
        assert.isArray(payload.elements[0].buttons);
        assert.lengthOf(payload.elements[0].buttons, 3);
        var buttons = payload.elements[0].buttons;
        assert.equal(buttons[0].type, 'postback');
        assert.equal(buttons[0].value, 'value 1');
        assert.equal(buttons[0].label, 'Value 1');
        assert.equal(buttons[1].type, 'url');
        assert.equal(buttons[1].url, 'http://javascript-jedi.com');
        assert.equal(buttons[1].label, 'Value 2');
        assert.equal(buttons[2].type, 'call');
        assert.equal(buttons[2].value, '+39347123456');
        assert.equal(buttons[2].label, 'Call me');
      });
  });

  it('should create a generic template with Facebook passing all params in the payload of upstream node', () => {
    const msg = RED.createMessage({
      title: 'message for the template',
      templateType: 'generic',
      subtitle: 'I am a subtitle',
      imageUrl: 'http://the.image.png',
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
    }, 'facebook');
    RED.node.config({});
    MessengerTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const payload = RED.node.message().payload;

        assert.equal(payload.type, 'template');
        assert.equal(payload.templateType, 'generic');
        assert.equal(payload.chatId, 42);
        assert.isArray(payload.elements);
        assert.lengthOf(payload.elements, 1);
        assert.equal(payload.elements[0].title, 'message for the template');
        assert.equal(payload.elements[0].subtitle, 'I am a subtitle');
        assert.equal(payload.elements[0].imageUrl, 'http://the.image.png');
        assert.isArray(payload.elements[0].buttons);
        assert.lengthOf(payload.elements[0].buttons, 3);
        var buttons = payload.elements[0].buttons;
        assert.equal(buttons[0].type, 'postback');
        assert.equal(buttons[0].value, 'value 1');
        assert.equal(buttons[0].label, 'Value 1');
        assert.equal(buttons[1].type, 'url');
        assert.equal(buttons[1].url, 'http://javascript-jedi.com');
        assert.equal(buttons[1].label, 'Value 2');
        assert.equal(buttons[2].type, 'call');
        assert.equal(buttons[2].value, '+39347123456');
        assert.equal(buttons[2].label, 'Call me');
      });
  });

});
