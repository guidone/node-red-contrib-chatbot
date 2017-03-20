var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var MenuBlock = require('../chatbot-messenger-menu');

describe('Chat menu node', function() {

  it('should create a persistent menu in facebook', function() {
    var msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      items: [
        {
          type: 'web_url',
          title: 'JavaScript Jedi',
          url: 'http://javascript-jedi.com',
          webview_height_ratio: 'full' // tall|full|compact
        },
        {
          type: 'postback',
          title: 'Help',
          payload: '/help'
        }
      ]
    });
    MenuBlock(RED);
    RED.node.get().emit('input', msg);

    assert.equal(RED.node.message(0).originalMessage.chat.id, '42');
    assert.equal(RED.node.message(0).originalMessage.transport, 'facebook');
    assert.equal(RED.node.message(0).payload.type, 'persistent-menu');
    assert.isArray(RED.node.message(0).payload.items);
    assert.isObject(RED.node.message(0).payload.items[0]);
    assert.equal(RED.node.message(0).payload.items[0].type, 'web_url');
    assert.equal(RED.node.message(0).payload.items[0].title, 'JavaScript Jedi');
    assert.equal(RED.node.message(0).payload.items[0].webview_height_ratio, 'full');
    assert.isObject(RED.node.message(0).payload.items[1]);
    assert.equal(RED.node.message(0).payload.items[1].type, 'postback');
    assert.equal(RED.node.message(0).payload.items[1].title, 'Help');
    assert.equal(RED.node.message(0).payload.items[1].payload, '/help');

  });

  it('should not create a persistent menu in telegram', function() {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      items: [
        {
          type: 'web_url',
          title: 'JavaScript Jedi',
          url: 'http://javascript-jedi.com',
          webview_height_ratio: 'full' // tall|full|compact
        },
        {
          type: 'postback',
          title: 'Help',
          payload: '/help'
        }
      ]
    });
    MenuBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
  });

  it('should not create a persistent menu in slack', function() {
    var msg = RED.createMessage(null, 'slack');
    RED.node.config({
      items: [
        {
          type: 'web_url',
          title: 'JavaScript Jedi',
          url: 'http://javascript-jedi.com',
          webview_height_ratio: 'full' // tall|full|compact
        },
        {
          type: 'postback',
          title: 'Help',
          payload: '/help'
        }
      ]
    });
    MenuBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
  });

  it('should not create a persistent menu in smooch', function() {
    var msg = RED.createMessage(null, 'smooch');
    RED.node.config({
      items: [
        {
          type: 'web_url',
          title: 'JavaScript Jedi',
          url: 'http://javascript-jedi.com',
          webview_height_ratio: 'full' // tall|full|compact
        },
        {
          type: 'postback',
          title: 'Help',
          payload: '/help'
        }
      ]
    });
    MenuBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
  });

});

