var _ = require('underscore');
var fs = require('fs');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var InlineQueryBlock = require('../nodes/chatbot-inline-query');

describe('Inline query node', function() {

  it('should prepare answer payload for inline query', function () {
    var msg = RED.createMessage(null, 'telegram');
    msg.originalMessage.inlineQueryId = 42;
    RED.node.config({
      inlineQueryAnswer: [
        {
          type: 'result',
          msg:  'Result 1'
        },
        {
          type: 'result',
          msg:  'Result 2'
        }
      ],
      caching: 300,
      personal: true
    });
    InlineQueryBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        var message = RED.node.message();
        assert.isArray(message.payload.content);
        assert.lengthOf(message.payload.content, 2);
        assert.equal(message.payload.caching, 300);
        assert.isTrue(message.payload.personal);
      });
  });

  it('should prepare answer payload for inline query with input message', function () {
    var msg = RED.createMessage({
      inlineQueryAnswer: [
        {
          type: 'result',
          msg:  'Result 1'
        },
        {
          type: 'result',
          msg:  'Result 2'
        }
      ],
      caching: 300,
      personal: true
    }, 'telegram');
    msg.originalMessage.inlineQueryId = 42;
    RED.node.config({});
    InlineQueryBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        var message = RED.node.message();
        assert.isArray(message.payload.content);
        assert.lengthOf(message.payload.content, 2);
        assert.equal(message.payload.caching, 300);
        assert.isTrue(message.payload.personal);
      });
  });

  it('should prepare answer payload for inline query', function () {
    var msg = RED.createMessage(null, 'telegram');
    RED.node.config({
      inlineQueryAnswer: [
        {
          type: 'result',
          msg:  'Result 1'
        },
        {
          type: 'result',
          msg:  'Result 2'
        }
      ],
      caching: 300,
      personal: true
    });
    InlineQueryBlock(RED);
    RED.node.get().emit('input', msg);

    return RED.node.get().await()
      .then(function() {
        // do nothing
      }, function(error) {
        assert.equal(error, 'The inline query id (inlineQueryId) is empty.');
      });
  });

});
