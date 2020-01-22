const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const AlexaSpeechBlock = require('../nodes/chatbot-alexa-speech');

require('../lib/platforms/alexa');

describe('Chat alexa speech node', () => {

  it('should send the speech with plain text', () => {
    const msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      speechType: 'plainText',
      text: 'Hi {{name}}!',
      playBehavior: 'enqueue',
      reprompt: false
    });
    msg.chat().set('name', 'Guidone');
    AlexaSpeechBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'speech');
        assert.equal(RED.node.message().payload.speechType, 'PlainText');
        assert.equal(RED.node.message().payload.playBehavior, 'ENQUEUE');
        assert.equal(RED.node.message().payload.reprompt, false);
        assert.equal(RED.node.message().payload.text, 'Hi Guidone!');
      });
  });

  it('should send the speech with ssml', () => {
    const msg = RED.createMessage(null, 'alexa');
    RED.node.config({
      speechType: 'ssml',
      ssml: '<speech>Hi {{name}}!</speech>',
      playBehavior: 'replaceAll',
      reprompt: false
    });
    msg.chat().set('name', 'Guidone');
    AlexaSpeechBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'speech');
        assert.equal(RED.node.message().payload.speechType, 'SSML');
        assert.equal(RED.node.message().payload.playBehavior, 'REPLACE_ALL');
        assert.equal(RED.node.message().payload.reprompt, false);
        assert.equal(RED.node.message().payload.ssml, '<speech>Hi Guidone!</speech>');
      });
  });

  it('should send the speech with ssml using the payload string', () => {
    const msg = RED.createMessage('<speech>Hi {{name}}!</speech>', 'alexa');
    RED.node.config({
      speechType: 'ssml',
      playBehavior: 'replaceAll',
      reprompt: false
    });
    msg.chat().set('name', 'Guidone');
    AlexaSpeechBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'speech');
        assert.equal(RED.node.message().payload.speechType, 'SSML');
        assert.equal(RED.node.message().payload.playBehavior, 'REPLACE_ALL');
        assert.equal(RED.node.message().payload.reprompt, false);
        assert.equal(RED.node.message().payload.ssml, '<speech>Hi Guidone!</speech>');
      });
  });

  it('should send the speech with ssml using the payload params', () => {
    const msg = RED.createMessage({
      speechType: 'ssml',
      ssml: '<speech>Hi {{name}}!</speech>',
      playBehavior: 'replaceAll',
      reprompt: false
    }, 'alexa');
    RED.node.config({});
    msg.chat().set('name', 'Guidone');
    AlexaSpeechBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message().payload.type, 'speech');
        assert.equal(RED.node.message().payload.speechType, 'SSML');
        assert.equal(RED.node.message().payload.playBehavior, 'REPLACE_ALL');
        assert.equal(RED.node.message().payload.reprompt, false);
        assert.equal(RED.node.message().payload.ssml, '<speech>Hi Guidone!</speech>');
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
    AlexaSpeechBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {
          // should fail
        },
        () => {
          assert.isNull(RED.node.message());
          assert.equal(RED.node.error(), 'Node "speech" is not supported by unknown transport');
        });
  });

});

