const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const NLPTrainBlock = require('../nodes/chatbot-nlp-train');
const NLPBlock = require('../nodes/chatbot-nlp');

require('../lib/platforms/telegram');
require('../lib/platforms/slack/index');

describe('Chat nlp entity node', () => {

  const createTrainMessage = () => {
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
          room: {
            type: 'enum',
            entities: [
              { name: 'kitchen' },
              { name: 'dining room' },
              { name: 'lavatory' }
            ]
          }
        }
      }
    });
    return msg;
  }

  it('should process an inbound message', () => {
    const msg = createTrainMessage();
    RED.node.config({});
    NLPTrainBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const nlpManager = RED.node.message().payload;
        const msg = RED.createMessage({
          content: 'switch on lights in the kitchen',
        });
        msg.scoreThreshold = 80;
        RED.node.config({ scoreThreshold: 80 });
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
        assert.isObject(RED.node.message().previous);
        assert.equal(RED.node.message().previous.content, 'switch on lights in the kitchen');
      });
  });

  it('should process a plain string', () => {
    const msg = createTrainMessage();
    RED.node.config({});
    NLPTrainBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const nlpManager = RED.node.message().payload;
        const msg = {
          payload: 'switch on lights in the kitchen'
        };
        RED.node.config({ scoreThreshold: 80 });
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

  it('should raise an error if model not found', async () => {
    const msg = {
      payload: 'switch on lights in the kitchen'
    };
    RED.node.config({ scoreThreshold: 80 });
    NLPBlock(RED);
    RED.node.get().emit('input', msg);
    try {
      await RED.node.get().await();
    } catch(e) {
      assert.equal(e, 'NLP Model not found');
    }
  });

});
