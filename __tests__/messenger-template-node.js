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
        function () { },
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

  it('should be possible to create generic templates upstream', async () => {
    const msg = RED.createMessage({
      elements: [
        {
          templateType: 'generic',
          title: 'my title',
          subtitle: 'I am a sub title',
          imageUrl: 'https://picsum.photos/200/300',
          buttons: [
            {
              type: 'url',
              url: 'http://javascript-jedi.com',
              label: 'Javascript Jedi'
            }
          ]
        },
        {
          templateType: 'generic',
          title: 'another title',
          subtitle: 'Second sub title',
          imageUrl: 'https://picsum.photos/200/300',
          buttons: [
            {
              type: 'url',
              url: 'http://javascript-jedi.com',
              label: 'Javascript Jedi'
            }
          ]
        }
      ]

    }, 'facebook');
    RED.node.config({});
    MessengerTemplateBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await()

    const payload = RED.node.message().payload;

    assert.equal(payload.type, 'template');
    assert.equal(payload.templateType, 'generic');
    assert.equal(payload.chatId, 42);
    assert.isArray(payload.elements);
    assert.lengthOf(payload.elements, 2);
    assert.equal(payload.elements[0].title, 'my title');
    assert.equal(payload.elements[0].subtitle, 'I am a sub title');
    assert.equal(payload.elements[0].imageUrl, 'https://picsum.photos/200/300');
    assert.isArray(payload.elements[0].buttons);
    assert.lengthOf(payload.elements[0].buttons, 1);
    const buttons = payload.elements[0].buttons;
    assert.equal(buttons[0].type, 'url');
    assert.equal(buttons[0].url, 'http://javascript-jedi.com');
    assert.equal(buttons[0].label, 'Javascript Jedi');

    assert.equal(payload.elements[1].title, 'another title');
    assert.equal(payload.elements[1].subtitle, 'Second sub title');
    assert.equal(payload.elements[1].imageUrl, 'https://picsum.photos/200/300');
    assert.isArray(payload.elements[1].buttons);
    assert.lengthOf(payload.elements[1].buttons, 1);
    const buttons2 = payload.elements[1].buttons;
    assert.equal(buttons2[0].type, 'url');
    assert.equal(buttons2[0].url, 'http://javascript-jedi.com');
    assert.equal(buttons2[0].label, 'Javascript Jedi');
  });
});
