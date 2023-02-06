const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const KeyboardBlock = require('../nodes/chatbot-ask');

require('../lib/platforms/telegram');

describe('Chat keyword node', () => {

  it('should send custom keyboard in Telegram', async () => {
    const msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      message: 'message for the buttons',
      buttons: [
        {
          type: 'keyboardButton',
          label: 'Value 1'
        },
        {
          type: 'keyboardButton',
          label: 'Value 2'
        },
        {
          type: 'newline'
        },
        {
          type: 'keyboardButton',
          label: 'Value 3'
        }
      ]
    });
    KeyboardBlock(RED);
    RED.node.get().emit('input', msg);

    await RED.node.get().await()

    assert.equal(RED.node.message().payload.type, 'telegram-buttons');
    assert.equal(RED.node.message().payload.content, 'message for the buttons');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.isArray(RED.node.message().payload.buttons);
    assert.equal(RED.node.message().payload.buttons[0].type, 'keyboardButton');
    assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
    assert.equal(RED.node.message().payload.buttons[1].type, 'keyboardButton');
    assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
    assert.equal(RED.node.message().payload.buttons[2].type, 'newline');
    assert.equal(RED.node.message().payload.buttons[3].type, 'keyboardButton');
    assert.equal(RED.node.message().payload.buttons[3].label, 'Value 3');

  });

  it('should send a reset keyboard if the buttons array is empty', async () => {
    const msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      message: 'message for the buttons',
      buttons: []
    });
    KeyboardBlock(RED);
    RED.node.get().emit('input', msg);

    await RED.node.get().await()

    assert.equal(RED.node.message().payload.type, 'telegram-reset-buttons');
    assert.equal(RED.node.message().payload.content, 'message for the buttons');
    assert.equal(RED.node.message().payload.chatId, 42);
  });


  it('should send custom keyboard in Telegram passed thru payload', async () => {
    const msg = RED.createMessage({
      message: 'message for the buttons',
      buttons: [
        {
          type: 'keyboardButton',
          label: 'Value 1'
        },
        {
          type: 'keyboardButton',
          label: 'Value 2'
        },
        {
          type: 'newline'
        },
        {
          type: 'keyboardButton',
          label: 'Value 3'
        }
      ]
    }, 'telegram');

    RED.node.config({});
    KeyboardBlock(RED);
    RED.node.get().emit('input', msg);

    await RED.node.get().await()

    assert.equal(RED.node.message().payload.type, 'telegram-buttons');
    assert.equal(RED.node.message().payload.content, 'message for the buttons');
    assert.equal(RED.node.message().payload.chatId, 42);
    assert.isArray(RED.node.message().payload.buttons);
    assert.equal(RED.node.message().payload.buttons[0].type, 'keyboardButton');
    assert.equal(RED.node.message().payload.buttons[0].label, 'Value 1');
    assert.equal(RED.node.message().payload.buttons[1].type, 'keyboardButton');
    assert.equal(RED.node.message().payload.buttons[1].label, 'Value 2');
    assert.equal(RED.node.message().payload.buttons[2].type, 'newline');
    assert.equal(RED.node.message().payload.buttons[3].type, 'keyboardButton');
    assert.equal(RED.node.message().payload.buttons[3].label, 'Value 3');
  });

  it('should NOT send custom keyboard in Facebook', async () => {
    const msg = RED.createMessage({}, 'facebook');
    RED.node.config({
      message: 'message for the buttons',
      answers: [
        {
          value: 'value 1',
          label: 'Value 1'
        },
        {
          value: 'value 2',
          label: 'Value 2'
        },
        {
          value: 'value 3',
          label: 'Value 3'
        }
      ]
    });
    KeyboardBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message());
  });

  it('should NOT send custom keyboard in Slack', async () => {
    const msg = RED.createMessage({}, 'slack');
    RED.node.config({
      message: 'message for the buttons',
      answers: [
        {
          value: 'value 1',
          label: 'Value 1'
        },
        {
          value: 'value 2',
          label: 'Value 2'
        },
        {
          value: 'value 3',
          label: 'Value 3'
        }
      ]
    });
    KeyboardBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message());
  });

});
