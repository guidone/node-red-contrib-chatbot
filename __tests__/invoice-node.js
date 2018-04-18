var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var InvoiceBlock = require('../nodes/chatbot-invoice');

describe('Invoice Shipping node', function() {

  it('prepare an invoice in config', function() {
    var msg = RED.createMessage({
    });
    RED.node.config({
      title: 'Invoice title',
      description: 'Invoice description',
      currency: 'EUR',
      payload: 'MY PAYLOAD',
      needName: false,
      needEmail: false,
      needPhoneNumber: false,
      needShippingAddress: false,
      isFlexible: false,
      prices: [
        { label: 'Price 1', amount: 12 },
        { label: 'Price 2', amount: '{{price}}' }
      ]
    });
    msg.chat().set({
      price: 42
    });
    InvoiceBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        var message = RED.node.message();
        assert.equal(message.payload.type, 'invoice');
        assert.equal(message.payload.title, 'Invoice title');
        assert.equal(message.payload.description, 'Invoice description');
        assert.equal(message.payload.currency, 'EUR');
        assert.equal(message.payload.payload, 'MY PAYLOAD');
        assert.equal(message.payload.needName, false);
        assert.equal(message.payload.needEmail, false);
        assert.equal(message.payload.needPhoneNumber, false);
        assert.equal(message.payload.needShippingAddress, false);
        assert.equal(message.payload.isFlexible, false);
        assert.isArray(message.payload.prices);
        assert.equal(message.payload.prices[0].label, 'Price 1');
        assert.equal(message.payload.prices[0].amount, 12);
        assert.equal(message.payload.prices[1].label, 'Price 2');
        assert.equal(message.payload.prices[1].amount, 42);
      });
  });

  it('prepare an invoice in message payload', function() {
    var msg = RED.createMessage({
      title: 'Invoice title',
      description: 'Invoice description',
      currency: 'EUR',
      payload: 'MY PAYLOAD',
      needName: false,
      needEmail: false,
      needPhoneNumber: false,
      needShippingAddress: false,
      isFlexible: false,
      prices: [
        { label: 'Price 1', amount: 12 },
        { label: 'Price 2', amount: '{{price}}' }
      ]
    });
    RED.node.config({
    });
    msg.chat().set({
      price: 42
    });
    InvoiceBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        var message = RED.node.message();
        assert.equal(message.payload.type, 'invoice');
        assert.equal(message.payload.title, 'Invoice title');
        assert.equal(message.payload.description, 'Invoice description');
        assert.equal(message.payload.currency, 'EUR');
        assert.equal(message.payload.payload, 'MY PAYLOAD');
        assert.equal(message.payload.needName, false);
        assert.equal(message.payload.needEmail, false);
        assert.equal(message.payload.needPhoneNumber, false);
        assert.equal(message.payload.needShippingAddress, false);
        assert.equal(message.payload.isFlexible, false);
        assert.isArray(message.payload.prices);
        assert.equal(message.payload.prices[0].label, 'Price 1');
        assert.equal(message.payload.prices[0].amount, 12);
        assert.equal(message.payload.prices[1].label, 'Price 2');
        assert.equal(message.payload.prices[1].amount, 42);
      });
  });

  it('prepare an invoice with wrong template substitution', function() {
    var msg = RED.createMessage({
      title: 'Invoice title',
      description: 'Invoice description',
      currency: 'EUR',
      payload: 'MY PAYLOAD',
      needName: false,
      needEmail: false,
      needPhoneNumber: false,
      needShippingAddress: false,
      isFlexible: false,
      prices: [
        { label: 'Price 1', amount: 12 },
        { label: 'Price 2', amount: '{{price}}' }
      ]
    });
    RED.node.config({
    });
    msg.chat().set({
      price: 'NOWAY'
    });
    InvoiceBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        function () {
        },
        function(error) {
          assert.include(error, 'Invalid prices in Invoice node');
          assert.include(error, 'NOWAY');
        });
  });


});

