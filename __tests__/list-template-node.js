var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var ListTemplateBlock = require('../nodes/chatbot-list-template');

require('../lib/platforms/facebook/facebook');

describe('Chat list template node', function() {

  it('should not pass through with Telegram', function() {
    var msg = RED.createMessage({}, 'telegram');
    RED.node.config({
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
    ListTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isNull(RED.node.message());
  });

  it('should not pass through with Smooch', function() {
    var msg = RED.createMessage({}, 'smooch');
    RED.node.config({
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
    ListTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isNull(RED.node.message());
  });

  it('should create a list template with Facebook', async function() {
    var msg = RED.createMessage({}, 'facebook');
    RED.node.config({
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
    ListTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await();
    const payload = RED.node.message().payload;

    assert.equal(payload.type, 'list-template');
    assert.equal(payload.chatId, 42);
    assert.isArray(payload.elements);
    assert.lengthOf(payload.elements, 1);
    assert.equal(payload.elements[0].title, 'message for the template');
    assert.equal(payload.elements[0].subtitle, 'I am a subtitle');
    assert.equal(payload.elements[0].imageUrl, 'http://the.image.png');
    assert.isArray(payload.elements[0].buttons);
    assert.lengthOf(payload.elements[0].buttons, 1);
    const buttons = payload.elements[0].buttons;
    assert.equal(buttons[0].type, 'postback');
    assert.equal(buttons[0].value, 'value 1');
    assert.equal(buttons[0].label, 'Value 1');
  });

  it('should create a list template with Facebook passing the buttons as payload in upstream node', async () => {
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
    ], 'facebook');
    RED.node.config({
      title: 'message for the template',
      subtitle: 'I am a subtitle',
      imageUrl: 'http://the.image.png'
    });
    ListTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await()
    const payload = RED.node.message().payload;

    assert.equal(payload.type, 'list-template');
    assert.equal(payload.chatId, 42);
    assert.isArray(payload.elements);
    assert.lengthOf(payload.elements, 1);
    assert.equal(payload.elements[0].title, 'message for the template');
    assert.equal(payload.elements[0].subtitle, 'I am a subtitle');
    assert.equal(payload.elements[0].imageUrl, 'http://the.image.png');
    assert.isArray(payload.elements[0].buttons);
    assert.lengthOf(payload.elements[0].buttons, 1);
    const buttons = payload.elements[0].buttons;
    assert.equal(buttons[0].type, 'postback');
    assert.equal(buttons[0].value, 'value 1');
    assert.equal(buttons[0].label, 'Value 1');
  });

  it('should create a list template with Facebook passing all params in the payload of upstream node', async () => {
    const msg = RED.createMessage({
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
    }, 'facebook');
    RED.node.config({});
    ListTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await()
    const payload = RED.node.message().payload;

    assert.equal(payload.type, 'list-template');
    assert.equal(payload.chatId, 42);
    assert.isArray(payload.elements);
    assert.lengthOf(payload.elements, 1);
    assert.equal(payload.elements[0].title, 'message for the template');
    assert.equal(payload.elements[0].subtitle, 'I am a subtitle');
    assert.equal(payload.elements[0].imageUrl, 'http://the.image.png');
    assert.isObject(payload.elements[0].default_action);
    assert.equal(payload.elements[0].default_action.type, 'url');
    assert.equal(payload.elements[0].default_action.url, 'http://javascript-jedi.com');
    assert.equal(payload.elements[0].default_action.label, 'Value 2');
    assert.isArray(payload.elements[0].buttons);
    assert.lengthOf(payload.elements[0].buttons, 1);
    const buttons = payload.elements[0].buttons;
    assert.equal(buttons[0].type, 'postback');
    assert.equal(buttons[0].value, 'value 1');
    assert.equal(buttons[0].label, 'Value 1');
  });

  it('should create a list template chaining two list template', async () => {
    const msg = RED.createMessage({
      elements: [{
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
          }
        ]
      }]
    }, 'facebook');
    RED.node.config({
      title: 'Hello I am the second template',
      subtitle: 'More subtitle',
      imageUrl: 'http://a.different.image.png',
      buttons: [
        {
          type: 'share'
        },
        {
          type: 'logout'
        },
        {
          type: 'call',
          value: '+39347654321',
          label: 'Call me!'
        }
      ]
    });
    ListTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await()
    const payload = RED.node.message().payload;
    let buttons = null;

    assert.equal(payload.type, 'list-template');
    assert.equal(payload.chatId, 42);
    assert.isArray(payload.elements);
    assert.lengthOf(payload.elements, 2);
    assert.equal(payload.elements[0].title, 'message for the template');
    assert.equal(payload.elements[0].subtitle, 'I am a subtitle');
    assert.equal(payload.elements[0].imageUrl, 'http://the.image.png');
    assert.isArray(payload.elements[0].buttons);
    assert.lengthOf(payload.elements[0].buttons, 1);
    buttons = payload.elements[0].buttons;
    assert.equal(buttons[0].type, 'postback');
    assert.equal(buttons[0].value, 'value 1');
    assert.equal(buttons[0].label, 'Value 1');
    assert.equal(payload.elements[1].title, 'Hello I am the second template');
    assert.equal(payload.elements[1].subtitle, 'More subtitle');
    assert.equal(payload.elements[1].imageUrl, 'http://a.different.image.png');
    buttons = payload.elements[1].buttons;
    assert.equal(buttons[0].type, 'share');
  });

  it('should create a list template with global button chaining two generic template', async () => {
    const msg = RED.createMessage({
      elements: [{
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
          }
        ]
      }]
    }, 'facebook');
    RED.node.config({
      title: '',
      subtitle: '',
      imageUrl: '',
      buttons: [
        {
          type: 'share'
        }
      ]
    });
    ListTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await()
    const payload = RED.node.message().payload;
    let buttons = null;

    assert.equal(payload.type, 'list-template');
    assert.equal(payload.chatId, 42);
    assert.isArray(payload.elements);
    assert.isArray(payload.globalButtons);
    assert.equal(payload.globalButtons[0].type, 'share');
    assert.lengthOf(payload.elements, 1);
    assert.equal(payload.elements[0].title, 'message for the template');
    assert.equal(payload.elements[0].subtitle, 'I am a subtitle');
    assert.equal(payload.elements[0].imageUrl, 'http://the.image.png');
    assert.isArray(payload.elements[0].buttons);
    assert.lengthOf(payload.elements[0].buttons, 1);
    buttons = payload.elements[0].buttons;
    assert.equal(buttons[0].type, 'postback');
    assert.equal(buttons[0].value, 'value 1');
    assert.equal(buttons[0].label, 'Value 1');

  });

});
