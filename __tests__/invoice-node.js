const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const InvoiceBlock = require('../nodes/chatbot-invoice');

describe('Invoice Shipping node', () => {

  it('prepare an invoice in config', () => {
    const msg = RED.createMessage({});
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
      .then(() => {
        const message = RED.node.message();
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

  it('prepare an invoice in message payload', () => {
    const msg = RED.createMessage({
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
      .then(() => {
        const message = RED.node.message();
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

  it('prepare an invoice with wrong template substitution', () => {
    const msg = RED.createMessage({
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
        () => {},
        error => {
          assert.include(error, `Invalid invoice: {"title":"Invoice title","description":"Invoice description","payload":"MY PAYLOAD","prices":[{"label":"Price 1","amount":"12"},{"label":"Price 2","amount":"NOWAY"}],"photoUrl":null,"photoHeight":null,"photoWidth":null,"currency":"EUR"} - prices[1] -> amount: Missing or invalid amount (must be number or variable)`);
          assert.include(error, 'NOWAY');
        });
  });

});

