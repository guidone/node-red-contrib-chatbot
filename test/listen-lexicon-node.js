var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ListenBlock = require('../nodes/chatbot-listen');
var ListenLexiconBlock = require('../nodes/chatbot-listen-lexicon');

describe('Chat listen lexicon node', function() {

  var CarLexicon = {
    'lamborghini': 'Car',
    'ferrari': 'Car',
    'fiat': 'Car',
    'audi': 'Car',
    'bmw': 'Car',
    'toyota': 'Car',
    'chrisler': 'Car',
    'peugeout talbot': 'Car'
  };
  var CarRules = [
    'drive[verb],[car]->my_car',
    'my,car[noun],is,[car]->my_car'
  ];

  it('should use a car lexicon with Listen owning', function () {
    var msg = RED.createMessage({
      content: 'my car is a Lamborghini',
      lexicon: CarLexicon
    });
    RED.node.config({
      rules: CarRules
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
    assert.isObject(RED.node.message(1));
    assert.equal(RED.node.message(1).payload.content, 'my car is a Lamborghini');
    assert.equal(RED.node.message(1).originalMessage.chat.id, 42);
    assert.equal(msg.chat().get('my_car'), 'lamborghini');
  });

  it('should use a car lexicon with Listen driving', function () {
    var msg = RED.createMessage({
      content: 'I am driving a chrisler',
      lexicon: CarLexicon
    });
    RED.node.config({
      rules: CarRules
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(1));
    assert.isObject(RED.node.message(0));
    assert.equal(RED.node.message(0).payload.content, 'I am driving a chrisler');
    assert.equal(RED.node.message(0).originalMessage.chat.id, 42);
    assert.equal(msg.chat().get('my_car'), 'chrisler');
  });

  it('should use a car lexicon with Listen driving perfect', function () {
    var msg = RED.createMessage({
      content: 'I am driving a chrisler',
      lexicon: CarLexicon
    });
    RED.node.config({
      rules: [
        'am driving[verb],[car]->my_car',
        'my,car[noun],is,[car]->my_car'
      ]
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(1));
    assert.isObject(RED.node.message(0));
    assert.equal(RED.node.message(0).payload.content, 'I am driving a chrisler');
    assert.equal(RED.node.message(0).originalMessage.chat.id, 42);
    assert.equal(msg.chat().get('my_car'), 'chrisler');
  });

  it('should not match a china motors car', function () {
    var msg = RED.createMessage({
      content: 'I am driving a china motors',
      lexicon: CarLexicon
    });
    RED.node.config({
      rules: CarRules
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(1));
    assert.isNull(RED.node.message(0));
  });

  it('should use a car with composite names', function () {
    var msg = RED.createMessage({
      content: 'my car is a Peugeout Talbot and I am happy',
      lexicon: CarLexicon
    });
    RED.node.config({
      rules: CarRules
    });
    ListenBlock(RED);
    RED.node.get().emit('input', msg);

    assert.isNull(RED.node.message(0));
    assert.isObject(RED.node.message(1));
    assert.equal(RED.node.message(1).payload.content, 'my car is a Peugeout Talbot and I am happy');
    assert.equal(RED.node.message(1).originalMessage.chat.id, 42);
    assert.equal(msg.chat().get('my_car'), 'peugeout talbot');
  });

  it('should add a lexicon inline', function () {
    var msg = RED.createMessage({
      content: 'my car is a Peugeout Talbot and I am happy'
    });
    RED.node.config({
      name: 'car',
      values: ['lamborghini', 'fiat']
    });
    ListenLexiconBlock(RED);
    RED.node.get().emit('input', msg);

    assert.equal(RED.node.message().payload.content, 'my car is a Peugeout Talbot and I am happy');
    assert.isObject(RED.node.message().payload.lexicon);
    assert.equal(RED.node.message().payload.lexicon['lamborghini'], 'car');
    assert.equal(RED.node.message().payload.lexicon['fiat'], 'car');
  });

  it('should chain two lexicons inline', function () {
    var msg = RED.createMessage({
      content: 'my car is a Peugeout Talbot and I am happy',
      lexicon: {
        'toyota': 'car',
        'obama': 'president'
      }
    });
    RED.node.config({
      name: 'car',
      values: ['lamborghini', 'fiat']
    });
    ListenLexiconBlock(RED);
    RED.node.get().emit('input', msg);

    assert.equal(RED.node.message().payload.content, 'my car is a Peugeout Talbot and I am happy');
    assert.isObject(RED.node.message().payload.lexicon);
    assert.equal(RED.node.message().payload.lexicon['lamborghini'], 'car');
    assert.equal(RED.node.message().payload.lexicon['fiat'], 'car');
    assert.equal(RED.node.message().payload.lexicon['toyota'], 'car');
    assert.equal(RED.node.message().payload.lexicon['obama'], 'president');
  });

});
