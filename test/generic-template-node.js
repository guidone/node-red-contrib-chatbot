var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var GenericTemplateBlock = require('../chatbot-generic-template');

describe('Chat generic template node', function() {

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
    GenericTemplateBlock(RED);
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
    GenericTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isNull(RED.node.message());
  });

  it('should create a generic template with Facebook', function() {
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
    GenericTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    var payload = RED.node.message().payload;

    assert.equal(payload.type, 'generic-template');
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

  it('should create a generic template with Facebook passing the buttons as payload in upstream node', function() {
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
    GenericTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    var payload = RED.node.message().payload;

    assert.equal(payload.type, 'generic-template');
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

  it('should create a generic template with Facebook passing all params in the payload of upstream node', function() {
    var msg = RED.createMessage({
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
    GenericTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    var payload = RED.node.message().payload;

    assert.equal(payload.type, 'generic-template');
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

  it('should create a carousel generic template chaining two generic template', function() {
    var msg = RED.createMessage({
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
    GenericTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    var payload = RED.node.message().payload;
    var buttons = null;

    assert.equal(payload.type, 'generic-template');
    assert.equal(payload.chatId, 42);
    assert.isArray(payload.elements);
    assert.lengthOf(payload.elements, 2);
    assert.equal(payload.elements[0].title, 'message for the template');
    assert.equal(payload.elements[0].subtitle, 'I am a subtitle');
    assert.equal(payload.elements[0].imageUrl, 'http://the.image.png');
    assert.isArray(payload.elements[0].buttons);
    assert.lengthOf(payload.elements[0].buttons, 3);
    buttons = payload.elements[0].buttons;
    assert.equal(buttons[0].type, 'postback');
    assert.equal(buttons[0].value, 'value 1');
    assert.equal(buttons[0].label, 'Value 1');
    assert.equal(buttons[1].type, 'url');
    assert.equal(buttons[1].url, 'http://javascript-jedi.com');
    assert.equal(buttons[1].label, 'Value 2');
    assert.equal(buttons[2].type, 'call');
    assert.equal(buttons[2].value, '+39347123456');
    assert.equal(buttons[2].label, 'Call me');
    assert.equal(payload.elements[1].title, 'Hello I am the second template');
    assert.equal(payload.elements[1].subtitle, 'More subtitle');
    assert.equal(payload.elements[1].imageUrl, 'http://a.different.image.png');
    buttons = payload.elements[1].buttons;
    assert.equal(buttons[0].type, 'share');
    assert.equal(buttons[1].type, 'logout');
    assert.equal(buttons[2].type, 'call');
    assert.equal(buttons[2].value, '+39347654321');
    assert.equal(buttons[2].label, 'Call me!');
  });

});
