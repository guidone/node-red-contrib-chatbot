const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const NLPTrainBlock = require('../nodes/chatbot-nlp-train');
const NLPBlock = require('../nodes/chatbot-nlp');

require('../lib/platforms/telegram');
require('../lib/platforms/slack');

describe('Chat nlp entity node', () => {

  it('set the entity payload', () => {    
    const msg = RED.createMessage({
      intents: {
        en: {
          'switch.on': [
            'switch on the the lights in the %room%',
            'switch on the lights in %room%',
            'turn on lights in %room%',
            'turn on the lights in the %room%',
          ]
        }
      },
      entities: {
        en: {
          room: [
            { name: 'kitchen' },
            { name: 'dining room' },
            { name: 'lavatory' }
          ]
        }
      }
    });
    RED.node.config({});
    NLPTrainBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const nlpManager = RED.node.message().payload;
        const msg = RED.createMessage({
          content: 'switch on lights in the kitchen'
        });
        NLPBlock(RED);
        // a little trick here with the stub
        RED.global.set('nlp_default', nlpManager);
        RED.node.get().emit('input', msg);
        return RED.node.get().await();
      })
      .then(() => {
        const payload = RED.node.message().payload;
        assert.equal(payload.type, 'intent');
        assert.equal(payload.isFallback, false);
        assert.equal(payload.language, 'en');
        assert.equal(payload.intent, 'switch.on');
        assert.isObject(payload.variables);
        assert.equal(payload.variables.room, 'kitchen');
      });
  });
  
});

