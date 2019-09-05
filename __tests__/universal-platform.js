var moment = require('moment');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var spies = require('chai-spies');
var RED = require('../lib/red-stub')();
var Universal = require('../lib/platforms/universal');
var ContextProviders = require('../lib/chat-platform/chat-context-factory');
var contextProviders = ContextProviders(RED);

chai.use(spies);

describe('Universal Connector', function() {

  var chatServer = null;
  var sendFunction = null;

  beforeEach(function() {
    sendFunction = chai.spy(function() { });
    chatServer = Universal.createServer({
      contextProvider: contextProviders.getProvider('memory'),
      debug: false
    });
    chatServer.onUserId(function(payload) {
      return payload.user.id;
    });
    chatServer.onChatId(function(payload) {
      return payload.chat_id;
    });
    chatServer.onMessageId(function(payload) {
      return payload._id;
    });
    chatServer.onLanguage(function(payload) {
      return payload.lang;
    });
    chatServer.in(function (message) {
      return new Promise(function(resolve, reject) {
        var chat = message.chat();
        if (message.originalMessage.text != null) {
          chat.set('payload', message.originalMessage.text);
          message.payload.content = message.originalMessage.text;
          message.payload.type = 'message';
        }
        resolve(message);
      });
    });
    chatServer.use(function (message) {
      return new Promise(function(resolve, reject) {
        message.custom_value = 42;
        resolve(message);
      });
    });
    chatServer.out('a-message-type', function(message) {
      return new Promise(function(resolve) {
        message.message_id = '444';
        message.a_custom_key = 42;
        sendFunction();
        resolve(message);
      });
    });
  });

  it('receive incoming message', function() {
    chatServer.start()
      .then(function() {
        chatServer.on('message', function(message) {
          assert.equal(message.payload.type, 'message');
          assert.equal(message.custom_value, 42);
          assert.equal(message.payload.chatId, '42');
          assert.equal(message.originalMessage.messageId, 'xyz');
          assert.equal(message.originalMessage.userId, 24);
          assert.isFunction(message.chat);
          var variables = message.chat().all();
          assert.equal(variables.payload, 'Bazinga');
          assert.equal(variables.transport, 'universal');
          assert.equal(variables.authorized, false);
          assert.equal(variables.language, 'it');
          assert.instanceOf(message.payload.ts, moment);
        });
        chatServer.receive({
          text: 'Bazinga',
          lang: 'it',
          chat_id: '42',
          _id: 'xyz',
          user: { id: 24 }
        });
      });
  });

  it('send outgoing message', function() {
    return chatServer.start()
      .then(function() {
        return chatServer.createMessage('42', '1234', '4567', {
          payload: {
            type: 'a-message-type'
          }
        });
      })
      .then(function(message) {
        return chatServer.send(message);
      })
      .then(function(message) {
        assert.equal(message.message_id, '444');
        assert.equal(message.a_custom_key, 42);
        assert.isFunction(message.chat);4
        assert.isFunction(message.api);
        assert.isObject(message.originalMessage);
        expect(sendFunction).to.have.been.called();
      });
  });

  it('send outgoing message wrong type', function() {
    return chatServer.start()
      .then(function() {
        return chatServer.createMessage('42', '1234', '4567', {
          payload: {
            type: 'a-different-type'
          }
        });
      })
      .then(function(message) {
        return chatServer.send(message);
      })
      .then(function(message) {
        expect(sendFunction).to.not.have.been.called();
      });
  });

});
