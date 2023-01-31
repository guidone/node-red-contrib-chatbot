const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const NLPEntityBlock = require('../nodes/chatbot-nlp-entity');

require('../lib/platforms/telegram');
require('../lib/platforms/slack/index');

describe('Chat nlp entity node', () => {

  it('set the entity payload, should default to enum if not specified', async () => {
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
    await RED.node.get().await()

    const payload = RED.node.message().payload;
    assert.isObject(payload);
    assert.isObject(payload.entities);
    assert.isObject(payload.entities.en);
    assert.isObject(payload.entities.en.fruits);
    assert.equal(payload.entities.en.fruits.type, 'enum');

    const entities = payload.entities.en.fruits.entities;
    assert.lengthOf(entities, 2);
    assert.equal(entities[0].name, 'orange');
    assert.equal(entities[1].name, 'apple');
    assert.isArray(entities[1].aliases);
    assert.lengthOf(entities[1].aliases, 2);
    assert.equal(entities[1].aliases[0], 'golden apple');
    assert.equal(entities[1].aliases[1], 'granny smith apple');
  });

  it('set the entity with type enum', async () => {
    const msg = RED.createMessage();
    RED.node.config({
      name: 'fruits',
      language: 'en',
      entityType: 'enum',
      entities: [
        { name: 'orange' },
        { name: 'apple', aliases: ['golden apple', 'granny smith apple'] }
      ]
    });
    NLPEntityBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await()

    const payload = RED.node.message().payload;
    assert.isObject(payload);
    assert.isObject(payload.entities);
    assert.isObject(payload.entities.en);
    assert.isObject(payload.entities.en.fruits);
    assert.equal(payload.entities.en.fruits.type, 'enum');

    const entities = payload.entities.en.fruits.entities;
    assert.lengthOf(entities, 2);
    assert.equal(entities[0].name, 'orange');
    assert.equal(entities[1].name, 'apple');
    assert.isArray(entities[1].aliases);
    assert.lengthOf(entities[1].aliases, 2);
    assert.equal(entities[1].aliases[0], 'golden apple');
    assert.equal(entities[1].aliases[1], 'granny smith apple');
  });

  it('set the entity payload from message, defaults to enum', async () => {
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
    await RED.node.get().await()

    const payload = RED.node.message().payload;
    assert.isObject(payload);
    assert.isObject(payload.entities);
    assert.isObject(payload.entities.en);
    assert.isObject(payload.entities.en.fruits);
    assert.equal(payload.entities.en.fruits.type, 'enum');

    const entities = payload.entities.en.fruits.entities;
    assert.lengthOf(entities, 2);
    assert.equal(entities[0].name, 'orange');
    assert.equal(entities[1].name, 'apple');
    assert.isArray(entities[1].aliases);
    assert.lengthOf(entities[1].aliases, 2);
    assert.equal(entities[1].aliases[0], 'golden apple');
    assert.equal(entities[1].aliases[1], 'granny smith apple');
  });

  it('set the entity payload from message and append to previous', async () => {
    const msg = RED.createMessage({
      entities: {
        en: {
          fruits: {
            type: 'enum',
            entities: [
              { name: 'banana' }
            ]
          }
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
    await RED.node.get().await()

    const payload = RED.node.message().payload;
    assert.isObject(payload);
    assert.isObject(payload.entities);
    assert.isObject(payload.entities.en);
    assert.isObject(payload.entities.en.fruits);
    assert.equal(payload.entities.en.fruits.type, 'enum');

    const entities = payload.entities.en.fruits.entities;
    assert.lengthOf(entities, 3);
    assert.equal(entities[0].name, 'banana');
    assert.equal(entities[1].name, 'orange');
    assert.equal(entities[2].name, 'apple');
    assert.isArray(entities[2].aliases);
    assert.lengthOf(entities[2].aliases, 2);
    assert.equal(entities[2].aliases[0], 'golden apple');
    assert.equal(entities[2].aliases[1], 'granny smith apple');
  });

  it('set the entity with a valid regular expression', async () => {
    const msg = RED.createMessage();
    RED.node.config({
      name: 'fruits',
      language: 'en',
      entityType: 'regex',
      regex: '/[A-Z]{1,5}/'
    });
    NLPEntityBlock(RED);
    RED.node.get().emit('input', msg);
    await RED.node.get().await()

    const payload = RED.node.message().payload;
    assert.isObject(payload);
    assert.isObject(payload.entities);
    assert.isObject(payload.entities.en);
    assert.isObject(payload.entities.en.fruits);
    assert.equal(payload.entities.en.fruits.type, 'regex');
    assert.equal(payload.entities.en.fruits.regex, '/[A-Z]{1,5}/');
  });

  it('set the entity with an invalid regular expression',  () => {
    const msg = RED.createMessage();
    RED.node.config({
      name: 'fruits',
      language: 'en',
      entityType: 'regex',
      regex: 'e+['
    });
    NLPEntityBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {

        },
        e => {
          assert.equal(e, 'Invalid NLP.js regex for entity "fruits"');
        }
      )
  });

});
