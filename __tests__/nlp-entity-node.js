const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const NLPEntityBlock = require('../nodes/chatbot-nlp-entity');

require('../lib/platforms/telegram');
require('../lib/platforms/slack');

describe('Chat nlp entity node', () => {

  it('set the entity payload', () => {
    const msg = RED.createMessage();
    RED.node.config({
      name: 'fruits',
      language: 'en',
      entities: [
        { name: 'orange' },
        { name: 'apple', aliases: ['golden apple', 'granny smith apple'] } 
      ]
    });
    NLPEntityBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const payload = RED.node.message().payload;
        assert.isObject(payload);
        assert.isObject(payload.entities);
        assert.isObject(payload.entities.en);
        assert.isArray(payload.entities.en.fruits);
        assert.lengthOf(payload.entities.en.fruits, 2);
        assert.equal(payload.entities.en.fruits[0].name, 'orange');
        assert.equal(payload.entities.en.fruits[1].name, 'apple');
        assert.isArray(payload.entities.en.fruits[1].aliases);
        assert.lengthOf(payload.entities.en.fruits[1].aliases, 2);
        assert.equal(payload.entities.en.fruits[1].aliases[0], 'golden apple');
        assert.equal(payload.entities.en.fruits[1].aliases[1], 'granny smith apple');
      });

  });

  it('set the entity payload from message', () => {
    const msg = RED.createMessage({
      name: 'fruits',
      language: 'en',
      entities: [
        { name: 'orange' },
        { name: 'apple', aliases: ['golden apple', 'granny smith apple'] } 
      ]
    });
    RED.node.config({});
    NLPEntityBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const payload = RED.node.message().payload;
        assert.isObject(payload);
        assert.isObject(payload.entities);
        assert.isObject(payload.entities.en);
        assert.isArray(payload.entities.en.fruits);
        assert.lengthOf(payload.entities.en.fruits, 2);
        assert.equal(payload.entities.en.fruits[0].name, 'orange');
        assert.equal(payload.entities.en.fruits[1].name, 'apple');
        assert.isArray(payload.entities.en.fruits[1].aliases);
        assert.lengthOf(payload.entities.en.fruits[1].aliases, 2);
        assert.equal(payload.entities.en.fruits[1].aliases[0], 'golden apple');
        assert.equal(payload.entities.en.fruits[1].aliases[1], 'granny smith apple');
      });

  });

  it('set the entity payload from message and append to previous', () => {
    const msg = RED.createMessage({
      entities: { 
        en: { 
          fruits: [
            { name: 'banana' }
          ] 
        } 
      }
    });
    RED.node.config({
      name: 'fruits',
      language: 'en',
      entities: [
        { name: 'orange' },
        { name: 'apple', aliases: ['golden apple', 'granny smith apple'] } 
      ]
    });
    NLPEntityBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const payload = RED.node.message().payload;
        assert.isObject(payload);
        assert.isObject(payload.entities);
        assert.isObject(payload.entities.en);
        assert.isArray(payload.entities.en.fruits);
        assert.lengthOf(payload.entities.en.fruits, 3);
        assert.equal(payload.entities.en.fruits[0].name, 'banana');
        assert.equal(payload.entities.en.fruits[1].name, 'orange');
        assert.equal(payload.entities.en.fruits[2].name, 'apple');
        assert.isArray(payload.entities.en.fruits[2].aliases);
        assert.lengthOf(payload.entities.en.fruits[2].aliases, 2);
        assert.equal(payload.entities.en.fruits[2].aliases[0], 'golden apple');
        assert.equal(payload.entities.en.fruits[2].aliases[1], 'granny smith apple');
      });
  });

});

