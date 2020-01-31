const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const NLPEntityBlock = require('../nodes/chatbot-nlp-intent');

require('../lib/platforms/telegram');
require('../lib/platforms/slack');

describe('Chat nlp intent node', () => {

  it('set the intent payload', () => {
    const msg = RED.createMessage();
    RED.node.config({
      intent: 'switch.on',
      language: 'en',
      utterances: [
        'switch on the lights',
        'turn on the lights' 
      ]
    });
    NLPEntityBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const payload = RED.node.message().payload;
        assert.isObject(payload);
        assert.isObject(payload.intents);
        assert.isObject(payload.intents.en);
        assert.isArray(payload.intents.en['switch.on']);
        assert.lengthOf(payload.intents.en['switch.on'], 2);
        assert.equal(payload.intents.en['switch.on'][0], 'switch on the lights');
        assert.equal(payload.intents.en['switch.on'][1], 'turn on the lights');
        
      });
  });

  it('set the intent payload from message', () => {
    const msg = RED.createMessage({
      intent: 'switch.on',
      language: 'en',
      utterances: [
        'switch on the lights',
        'turn on the lights' 
      ]
    });
    RED.node.config({});
    NLPEntityBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const payload = RED.node.message().payload;
        assert.isObject(payload);
        assert.isObject(payload.intents);
        assert.isObject(payload.intents.en);
        assert.isArray(payload.intents.en['switch.on']);
        assert.lengthOf(payload.intents.en['switch.on'], 2);
        assert.equal(payload.intents.en['switch.on'][0], 'switch on the lights');
        assert.equal(payload.intents.en['switch.on'][1], 'turn on the lights');
        
      });
  });

  it('set the intent payload and append to previous', () => {
    const msg = RED.createMessage({
      intents: { 
        en: { 
          'switch.on': ['switch on all the lights'] 
        },
        it: { 
          'switch.on': ['appiccia la luce'] 
        } 
      } 
    });
    RED.node.config({
      intent: 'switch.on',
      language: 'en',
      utterances: [
        'switch on the lights',
        'turn on the lights' 
      ]
    });
    NLPEntityBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const payload = RED.node.message().payload;      
        assert.isObject(payload);
        assert.isObject(payload.intents);
        assert.isObject(payload.intents.en);
        assert.isArray(payload.intents.en['switch.on']);
        assert.lengthOf(payload.intents.en['switch.on'], 3);
        assert.equal(payload.intents.en['switch.on'][0], 'switch on all the lights');
        assert.equal(payload.intents.en['switch.on'][1], 'switch on the lights');
        assert.equal(payload.intents.en['switch.on'][2], 'turn on the lights');
        assert.isArray(payload.intents.it['switch.on']);
        assert.lengthOf(payload.intents.it['switch.on'], 1);
        assert.equal(payload.intents.it['switch.on'][0], 'appiccia la luce');
      });
  });
});

