var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var InvoiceShippingBlock = require('../nodes/chatbot-invoice-shipping');

describe('Invoice Shipping node', function() {

  it('prepare shipping methods with vars', function() {
    var msg = RED.createMessage({
      shippingQueryId: '42'
    });
    RED.node.config({
      shippingOptions: [
        { id: 'dhl', label: 'DHL', amount: 12 },
        { id: 'fedex', label: 'Fedex', amount: '{{pricefedex}}' }
      ]
    });
    msg.chat().set({
      pricefedex: 42
    });
    InvoiceShippingBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        var message = RED.node.message();
        assert.equal(message.payload.type, 'invoice-shipping');
        assert.equal(message.payload.shippingQueryId, '42');
        assert.isArray(message.payload.shippingOptions);
        assert.equal(message.payload.shippingOptions[0].id, 'dhl');
        assert.equal(message.payload.shippingOptions[0].label, 'DHL');
        assert.equal(message.payload.shippingOptions[0].amount, 12);
        assert.equal(message.payload.shippingOptions[1].id, 'fedex');
        assert.equal(message.payload.shippingOptions[1].label, 'Fedex');
        assert.equal(message.payload.shippingOptions[1].amount, 42);
      });
  });

  it('prepare shipping methods with vars from payload', function() {
    var msg = RED.createMessage({
      shippingQueryId: '42',
      shippingOptions: [
        { id: 'dhl', label: 'DHL', amount: 12 },
        { id: 'fedex', label: 'Fedex', amount: '{{pricefedex}}' }
      ]
    });
    RED.node.config({
    });
    msg.chat().set({
      pricefedex: 42
    });
    InvoiceShippingBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(function () {
        var message = RED.node.message();
        assert.equal(message.payload.type, 'invoice-shipping');
        assert.equal(message.payload.shippingQueryId, '42');
        assert.isArray(message.payload.shippingOptions);
        assert.equal(message.payload.shippingOptions[0].id, 'dhl');
        assert.equal(message.payload.shippingOptions[0].label, 'DHL');
        assert.equal(message.payload.shippingOptions[0].amount, 12);
        assert.equal(message.payload.shippingOptions[1].id, 'fedex');
        assert.equal(message.payload.shippingOptions[1].label, 'Fedex');
        assert.equal(message.payload.shippingOptions[1].amount, 42);
      });
  });

  it('should raise an error if no shipping query id', function() {
    var msg = RED.createMessage({
      shippingOptions: [
        { id: 'dhl', label: 'DHL', amount: 12 },
        { id: 'fedex', label: 'Fedex', amount: '{{pricefedex}}' }
      ]
    });
    RED.node.config({
    });
    msg.chat().set({
      pricefedex: 42
    });
    InvoiceShippingBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        function () {},
        function(error) {
          assert.equal(error, 'shippingQueryId is null in payload, use Invoice Shipping in aswer to a "invoice-shipping" message');
        });
  });

});

