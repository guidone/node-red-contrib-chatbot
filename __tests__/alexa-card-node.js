const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const AlexaCardBlock = require('../nodes/chatbot-alexa-card');

require('../lib/platforms/alexa');

describe('Chat alexa card node', () => {

  it('should send the simple card', () => {
    const msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      cardType: 'simple',
      title: 'Hi {{name}}!',
      text: 'Ciao {{name}}'
    });
    msg.chat().set('name', 'Guidone');
    AlexaCardBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'card');
        assert.equal(RED.node.message().payload.cardType, 'simple');
        assert.equal(RED.node.message().payload.title, 'Hi Guidone!');
        assert.equal(RED.node.message().payload.content, 'Ciao Guidone');
      });
  });

  it('should send a standard call', () => {
    const msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      cardType: 'standard',
      title: 'Hi {{name}}!',
      text: 'Ciao {{name}}',
      smallImage: 'http://placeimg/small',
      largeImage: 'http://placeimg/large'
    });
    msg.chat().set('name', 'Guidone');
    AlexaCardBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'card');
        assert.equal(RED.node.message().payload.cardType, 'standard');
        assert.equal(RED.node.message().payload.title, 'Hi Guidone!');
        assert.equal(RED.node.message().payload.text, 'Ciao Guidone');
        assert.equal(RED.node.message().payload.smallImage, 'http://placeimg/small');
        assert.equal(RED.node.message().payload.largeImage, 'http://placeimg/large');
      });
  });

  it('should send the simple card using payload', () => {
    const msg = RED.createMessage({
      cardType: 'simple',
      title: 'Hi {{name}}!',
      text: 'Ciao {{name}}'
    }, 'alexa');
    RED.node.config({});
    msg.chat().set('name', 'Guidone');
    AlexaCardBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'card');
        assert.equal(RED.node.message().payload.cardType, 'simple');
        assert.equal(RED.node.message().payload.title, 'Hi Guidone!');
        assert.equal(RED.node.message().payload.content, 'Ciao Guidone');
      });
  });

  it('should send a standard call using payload', () => {
    const msg = RED.createMessage({
      cardType: 'standard',
      title: 'Hi {{name}}!',
      text: 'Ciao {{name}}',
      smallImage: 'http://placeimg/small',
      largeImage: 'http://placeimg/large'
    }, 'alexa');
    RED.node.config({});
    msg.chat().set('name', 'Guidone');
    AlexaCardBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'card');
        assert.equal(RED.node.message().payload.cardType, 'standard');
        assert.equal(RED.node.message().payload.title, 'Hi Guidone!');
        assert.equal(RED.node.message().payload.text, 'Ciao Guidone');
        assert.equal(RED.node.message().payload.smallImage, 'http://placeimg/small');
        assert.equal(RED.node.message().payload.largeImage, 'http://placeimg/large');
      });
  });

  it('should not send for an unknown platform', () => {
    const msg = RED.createMessage(null, 'unknown');
    RED.node.config({
      speechType: 'plainText',
      text: 'The message',
      playBehavior: 'enqueue',
      reprompt: false
    });
    AlexaCardBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {
          // should fail
        },
        () => {
          assert.isNull(RED.node.message());
          assert.equal(RED.node.error(), 'Node "card" is not supported by unknown transport');
        });
  });

});

