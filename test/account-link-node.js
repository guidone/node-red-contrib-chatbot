var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ActionBlock = require('../chatbot-account-link');

describe('Account link node', function() {

  it('should trigger account link for Facebook', function() {
    var msg = RED.createMessage(null, 'facebook');
    RED.node.config({
      authUrl: 'http://www.my-site.com/auth',
      message: 'Link to your account'
    });
    ActionBlock(RED);
    RED.node.get().emit('input', msg);
    assert.equal(RED.node.message().payload.type, 'account-link');
    assert.equal(RED.node.message().payload.authUrl, 'http://www.my-site.com/auth');
    assert.equal(RED.node.message().payload.content, 'Link to your account');
  });

  it('should NOT trigger account link for Telegram', function() {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      authUrl: 'http://www.my-site.com/auth',
      message: 'Link to your account'
    });
    ActionBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isNull(RED.node.message());
  });

  it('should NOT trigger account link for Slack', function() {
    var msg = RED.createMessage(null, 'slack');
    RED.node.config({
      authUrl: 'http://www.my-site.com/auth',
      message: 'Link to your account'
    });
    ActionBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isNull(RED.node.message());
  });

  it('should NOT trigger account link for Smooch', function() {
    var msg = RED.createMessage(null, 'smooch');
    RED.node.config({
      authUrl: 'http://www.my-site.com/auth',
      message: 'Link to your account'
    });
    ActionBlock(RED);
    RED.node.get().emit('input', msg);
    assert.isNull(RED.node.message());
  });

});

