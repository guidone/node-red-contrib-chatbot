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

  it('A replacement in an object', function() {
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
    return template({ key1: 'A simple string for {{name}}', key2: 'I am {{complex.key2.key3}}'})
      .then(function(result) {
        assert.equal(result.key1, 'A simple string for guido');
        assert.equal(result.key2, 'I am value3');
      });

  });

  it('A replacement in array', function() {
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
    return template(['A simple string for {{name}}','I am {{complex.key2.key3}}'])
      .then(function(result) {
        assert.equal(result[0], 'A simple string for guido');
        assert.equal(result[1], 'I am value3');
      });
  });

  it('A replacement in array of objects', function() {
    var msg = RED.createMessage();
    var node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({
      name: 'guido',
      prices: {
        postcard: 1.23,
        maxiPostcard: 3.14
      }});
    var template = MessageTemplate(msg, node);
    var prices = [
      { label: 'Postcard for {{name}}', amount: '{{prices.postcard}}'},
      { label: 'Postcard large for {{name}}', amount: '{{prices.maxiPostcard}}'}
    ];
    return template(prices)
      .then(function(result) {
        assert.isObject(result[0]);
        assert.equal(result[0].label, 'Postcard for guido');
        assert.equal(result[0].amount, '1.23');
        assert.isObject(result[1]);
        assert.equal(result[1].label, 'Postcard large for guido');
        assert.equal(result[1].amount, '3.14');
      });
  });

  it('A replacement in object with array of objects', function() {
    var msg = RED.createMessage();
    var node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({
      name: 'guido',
      prices: {
        postcard: 1.23,
        maxiPostcard: 3.14
      }});
    var template = MessageTemplate(msg, node);
    var payload = {
      description: 'This is an invoice {{name}}',
      prices: [
        { label: 'Postcard for {{name}}', amount: '{{prices.postcard}}'},
        { label: 'Postcard large for {{name}}', amount: '{{prices.maxiPostcard}}'}
      ]
    };
    return template(payload)
      .then(function(result) {
        assert.isObject(result);
        assert.equal(result.description, 'This is an invoice guido');
        assert.isObject(result.prices[0]);
        assert.equal(result.prices[0].label, 'Postcard for guido');
        assert.equal(result.prices[0].amount, '1.23');
        assert.isObject(result.prices[1]);
        assert.equal(result.prices[1].label, 'Postcard large for guido');
        assert.equal(result.prices[1].amount, '3.14');
      });
  });



});
