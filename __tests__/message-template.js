var _ = require('underscore');
var assert = require('chai').assert;
var helpers = require('../lib/helpers/regexps');
var MessageTemplate = require('../lib/message-template-async');
var RED = require('../lib/red-stub')();
var MessageBlock = require('../nodes/chatbot-message');

describe('Message template', function() {

  it('Leave a string without token intact', function() {

    var msg = RED.createMessage();
    //MessageBlock(RED);

    var node = {};
    RED.nodes.createNode(node, {});
    var template = MessageTemplate(msg, node);

    return template('I am a template')
      .then(function(result) {
        assert.equal(result, 'I am a template');
      });
  });

  it('Simple replacement of a token', function() {
    var msg = RED.createMessage();
    var node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({name: 'guido'});
    var template = MessageTemplate(msg, node);
    return template('I am a template for {{name}} user')
      .then(function(result) {
        assert.equal(result, 'I am a template for guido user');
      });
  });

  it('Simple replacement of a couple of tokens', function() {
    var msg = RED.createMessage();
    var node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({name: 'guido', email: 'test@gmail.com'});
    var template = MessageTemplate(msg, node);
    return template('I am a template for {{name}} user {{email}}')
      .then(function(result) {
        assert.equal(result, 'I am a template for guido user test@gmail.com');
      });
  });

  it('A double replacement of a couple of tokens', function() {
    var msg = RED.createMessage();
    var node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({name: 'guido', email: 'test@gmail.com'});
    var template = MessageTemplate(msg, node);
    return template('My name is {{name}}', 'This is the email {{email}}')
      .then(function(sentences) {
        assert.equal(sentences[0], 'My name is guido');
        assert.equal(sentences[1], 'This is the email test@gmail.com');
      });
  });

  it('A replacement with sub tokens', function() {
    var msg = RED.createMessage();
    var node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({
      name: 'guido',
      complex: {
        key1: 'value1',
        key2: {
          key3: 'value3'
        }
      }});
    var template = MessageTemplate(msg, node);
    return template('My name is {{complex.key1}} and {{complex.key2.key3}}')
      .then(function(sentences) {
        assert.equal(sentences, 'My name is value1 and value3');
      });
  });

});
