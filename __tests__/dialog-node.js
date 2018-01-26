var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var DialogBlock = require('../nodes/chatbot-dialog');

describe('Chat dialog node', function() {

  it('should send a dialog in Slack', function () {

    var msg = RED.createMessage({}, 'slack');
    RED.node.config({
      title: 'the title',
      submitLabel: 'Ok',
      elements: [
        {
          type: 'text',
          name: 'my_text',
          label: 'My Text'
        },
        {
          type: 'select',
          name: 'my_combo',
          label: 'My Combo',
          options: [
            { value: 'option_1', label: 'Option 1' },
            { value: 'option_2', label: 'Option 2' }
          ]
        }
      ]
    });
    DialogBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'dialog');
        assert.equal(RED.node.message().payload.title, 'the title');
        assert.equal(RED.node.message().payload.submitLabel, 'Ok');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.elements);
        assert.equal(RED.node.message().payload.elements[0].type, 'text');
        assert.equal(RED.node.message().payload.elements[0].name, 'my_text');
        assert.equal(RED.node.message().payload.elements[0].label, 'My Text');
        assert.equal(RED.node.message().payload.elements[1].type, 'select');
        assert.equal(RED.node.message().payload.elements[1].label, 'My Combo');
        assert.equal(RED.node.message().payload.elements[1].name, 'my_combo');
        assert.isArray(RED.node.message().payload.elements[1].options);
        assert.lengthOf(RED.node.message().payload.elements[1].options, 2);
      });
  });


  it('should send a dialog in Slack with inline parameters', function () {

    var msg = RED.createMessage({
      title: 'the title',
      submitLabel: 'Ok',
      elements: [
        {
          type: 'text',
          name: 'my_text',
          label: 'My Text'
        },
        {
          type: 'select',
          name: 'my_combo',
          label: 'My Combo',
          options: [
            { value: 'option_1', label: 'Option 1' },
            { value: 'option_2', label: 'Option 2' }
          ]
        }
      ]
    }, 'slack');
    RED.node.config({});
    DialogBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'dialog');
        assert.equal(RED.node.message().payload.title, 'the title');
        assert.equal(RED.node.message().payload.submitLabel, 'Ok');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.elements);
        assert.equal(RED.node.message().payload.elements[0].type, 'text');
        assert.equal(RED.node.message().payload.elements[0].name, 'my_text');
        assert.equal(RED.node.message().payload.elements[0].label, 'My Text');
        assert.equal(RED.node.message().payload.elements[1].type, 'select');
        assert.equal(RED.node.message().payload.elements[1].label, 'My Combo');
        assert.equal(RED.node.message().payload.elements[1].name, 'my_combo');
        assert.isArray(RED.node.message().payload.elements[1].options);
        assert.lengthOf(RED.node.message().payload.elements[1].options, 2);
      });
  });

  it('should send a dialog in Slack with some inline parameters', function () {

    var msg = RED.createMessage([
      {
        type: 'text',
        name: 'my_text',
        label: 'My Text'
      },
      {
        type: 'select',
        name: 'my_combo',
        label: 'My Combo',
        options: [
          { value: 'option_1', label: 'Option 1' },
          { value: 'option_2', label: 'Option 2' }
        ]
      }
    ], 'slack');
    RED.node.config({
      title: 'the title',
      submitLabel: 'Ok'
    });
    DialogBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        assert.equal(RED.node.message().payload.type, 'dialog');
        assert.equal(RED.node.message().payload.title, 'the title');
        assert.equal(RED.node.message().payload.submitLabel, 'Ok');
        assert.equal(RED.node.message().payload.chatId, 42);
        assert.isArray(RED.node.message().payload.elements);
        assert.equal(RED.node.message().payload.elements[0].type, 'text');
        assert.equal(RED.node.message().payload.elements[0].name, 'my_text');
        assert.equal(RED.node.message().payload.elements[0].label, 'My Text');
        assert.equal(RED.node.message().payload.elements[1].type, 'select');
        assert.equal(RED.node.message().payload.elements[1].label, 'My Combo');
        assert.equal(RED.node.message().payload.elements[1].name, 'my_combo');
        assert.isArray(RED.node.message().payload.elements[1].options);
        assert.lengthOf(RED.node.message().payload.elements[1].options, 2);
      });
  });

  it('should not send a dialog in Telegram', function () {
    var msg = RED.createMessage({}, 'telegram');
    RED.node.config({
      title: 'the title',
      submitLabel: 'Ok',
      elements: [
        {
          type: 'text',
          name: 'my_text',
          label: 'My Text'
        },
        {
          type: 'select',
          name: 'my_combo',
          label: 'My Combo',
          options: [
            { value: 'option_1', label: 'Option 1' },
            { value: 'option_2', label: 'Option 2' }
          ]
        }
      ]
    });
    DialogBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        function () {},
        function(error) {
          assert.equal(error, 'This node is not available for transport: telegram');
        });
  });

  it('should not send a dialog in Facebook', function () {
    var msg = RED.createMessage({}, 'facebook');
    RED.node.config({
      title: 'the title',
      submitLabel: 'Ok',
      elements: [
        {
          type: 'text',
          name: 'my_text',
          label: 'My Text'
        },
        {
          type: 'select',
          name: 'my_combo',
          label: 'My Combo',
          options: [
            { value: 'option_1', label: 'Option 1' },
            { value: 'option_2', label: 'Option 2' }
          ]
        }
      ]
    });
    DialogBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        function () {},
        function(error) {
          assert.equal(error, 'This node is not available for transport: facebook');
        });
  });

  it('should not send a dialog in Smooch', function () {
    var msg = RED.createMessage({}, 'smooch');
    RED.node.config({
      title: 'the title',
      submitLabel: 'Ok',
      elements: [
        {
          type: 'text',
          name: 'my_text',
          label: 'My Text'
        },
        {
          type: 'select',
          name: 'my_combo',
          label: 'My Combo',
          options: [
            { value: 'option_1', label: 'Option 1' },
            { value: 'option_2', label: 'Option 2' }
          ]
        }
      ]
    });
    DialogBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        function () {},
        function(error) {
          assert.equal(error, 'This node is not available for transport: smooch');
        });
  });



});
