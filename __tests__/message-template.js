const _ = require('underscore');
const assert = require('chai').assert;
const helpers = require('../lib/helpers/regexps');
const MessageTemplate = require('../lib/message-template-async');
const RED = require('../lib/red-stub')();
const MessageBlock = require('../nodes/chatbot-message');

describe('Message template', () => {

  it('Leave a string without token intact', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    const template = MessageTemplate(msg, node);

    return template('I am a template')
      .then(result => {
        assert.equal(result, 'I am a template');
      });
  });

  it('Leave a number without token intact', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    const template = MessageTemplate(msg, node);
    return template(1527491606935)
      .then(result => {
        assert.equal(result, '1527491606935');
      });
  });

  it('Simple replacement of a token', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({name: 'guido'});
    const template = MessageTemplate(msg, node);
    return template('I am a template for {{name}} user')
      .then(result => {
        assert.equal(result, 'I am a template for guido user');
      });
  });

  it('Simple replacement of a token with strange chars', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({user_name: 'guido'});
    const template = MessageTemplate(msg, node);
    return template('I am a template for {{user_name}} user')
      .then(result => {
        assert.equal(result, 'I am a template for guido user');
      });
  });

  it('Simple replacement of a couple of tokens', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({name: 'guido', email: 'test@gmail.com'});
    const template = MessageTemplate(msg, node);
    return template('I am a template for {{name}} user {{email}}')
      .then(result => {
        assert.equal(result, 'I am a template for guido user test@gmail.com');
      });
  });

  it('A double replacement of a couple of tokens', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({name: 'guido', email: 'test@gmail.com'});
    const template = MessageTemplate(msg, node);
    return template('My name is {{name}}', 'This is the email {{email}}')
      .then(sentences => {
        assert.equal(sentences[0], 'My name is guido');
        assert.equal(sentences[1], 'This is the email test@gmail.com');
      });
  });

  it('A replacement with sub tokens', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({
      name: 'guido',
      complex: {
        key1: 'value1',
        key2: {
          key3: 'value3'
        }
      }});
    const template = MessageTemplate(msg, node);
    return template('My name is {{complex.key1}} and {{complex.key2.key3}}')
      .then(sentences => {
        assert.equal(sentences, 'My name is value1 and value3');
      });
  });

  it('A replacement in an object', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({
      name: 'guido',
      complex: {
        key1: 'value1',
        key2: {
          key3: 'value3'
        }
      }});
    const template = MessageTemplate(msg, node);
    return template({ key1: 'A simple string for {{name}}', key2: 'I am {{complex.key2.key3}}'})
      .then(result => {
        assert.equal(result.key1, 'A simple string for guido');
        assert.equal(result.key2, 'I am value3');
      });
  });

  it('A replacement in an object with numbers as string', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({});
    const template = MessageTemplate(msg, node);
    return template({ key1: 42 })
      .then(result => {
        assert.strictEqual(result.key1, '42');
      });
  });

  it('A replacement in an object with numbers preserving type', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({});
    const template = MessageTemplate(msg, node, { preserveNumbers: true });
    return template({ key1: 42 })
      .then(result => {
        assert.strictEqual(result.key1, 42);
      });
  });

  it('A replacement in array', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({
      name: 'guido',
      complex: {
        key1: 'value1',
        key2: {
          key3: 'value3'
        }
      }});
    const template = MessageTemplate(msg, node);
    return template(['A simple string for {{name}}','I am {{complex.key2.key3}}'])
      .then(result => {
        assert.equal(result[0], 'A simple string for guido');
        assert.equal(result[1], 'I am value3');
      });
  });

  it('Replaces in array of objects', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({
      name: 'guido',
      prices: {
        postcard: 1.23,
        maxiPostcard: 3.14
      }});
    const template = MessageTemplate(msg, node);
    const prices = [
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

  it('Replaces object with array of objects', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({
      name: 'guido',
      prices: {
        postcard: 1.23,
        maxiPostcard: 3.14
      }});
    const template = MessageTemplate(msg, node);
    const payload = {
      description: 'This is an invoice {{name}}',
      prices: [
        { label: 'Postcard for {{name}}', amount: '{{prices.postcard}}'},
        { label: 'Postcard large for {{name}}', amount: '{{prices.maxiPostcard}}'}
      ]
    };
    return template(payload)
      .then(result => {
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

  it('Replaces in an object leaveing buffer untouched', () => {
    const msg = RED.createMessage();
    const node = {};
    RED.nodes.createNode(node, {});
    msg.chat().set({
      name: 'guido',
      complex: {
        key1: 'value1',
        key2: {
          key3: 'value3'
        }
      }});
    const template = MessageTemplate(msg, node);
    return template({ key1: new Buffer('I am a buffer'), key2: 'I am {{complex.key2.key3}}'})
      .then(result => {
        assert.instanceOf(result.key1, Buffer);
        assert.equal(result.key1.toString(), 'I am a buffer');
        assert.equal(result.key2, 'I am value3');
      });

  });

  

});
