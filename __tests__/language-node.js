const _ = require('underscore');
const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const LanguageBlock = require('../nodes/chatbot-language');

describe('Chat language node', () => {

  it('should detect italian language and override it', () => {
    const msg = RED.createMessage({
      content: 'posso avere un gelato?',
      chatId: 42
    });
    msg.chat().set('language', 'en');
    RED.node.config({
      language: 'italian',
      mode: 'medium'
    });
    LanguageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(msg.chat().get('language'), 'it');
        assert.equal(RED.node.message().payload.content, 'posso avere un gelato?');
        assert.equal(RED.node.message().payload.chatId, 42);        
      })    
  });

  it('should pass through commands', () => {
    const msg = RED.createMessage({
      content: '/help',
      chatId: 42
    });
    msg.chat().set('language', 'it');
    RED.node.config({});
    LanguageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(RED.node.message(0).payload.content, '/help');
        assert.equal(RED.node.message(0).payload.chatId, 42);
        assert.equal(msg.chat().get('language'), 'it');
      });
  });

  it('should detect english language', () => {
    const msg = RED.createMessage({
      content: 'What time is it?',
      chatId: 42
    });
    RED.node.config({});
    LanguageBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        assert.equal(msg.chat().get('language'), 'en');
        assert.equal(RED.node.message().payload.content, 'What time is it?');
        assert.equal(RED.node.message().payload.chatId, 42);
      });
  });

});

