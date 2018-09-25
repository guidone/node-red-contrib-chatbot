var _ = require('underscore');
var moment = require('moment');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var ChatExpress = require('../lib/chat-platform/chat-platform');
var Universal = require('../lib/platforms/universal');
var ContextProviders = require('../lib/chat-platform/chat-context-factory');
var os = require('os');
var fs = require('fs');
var utils = require('../lib/helpers/utils');
var when = utils.when;
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;

var contextProviders = ContextProviders(RED);


var Connector = function() {
  var _this = this;
  this.send = function(message) {
    _this.emit('message', message);
  };
  return this;
};
inherits(Connector, EventEmitter);
var connector = new Connector();


describe('Chat platform framework', function() {

  it('should create a simple platform and retain options', function() {

    var GenericPlatform = new ChatExpress({
      optionKey1: 'value1',
      chatIdKey: 'myChatIdKey',
      userIdKey: 'myUserIdKey',
      transport: 'generic',
      inboundMessageEvent: 'message',
      connector: connector,
      debug: false
    });
    var chatServer = GenericPlatform.createServer({
      optionKey2: 'value2',
      contextProvider: contextProviders.getProvider('memory')
    });

    assert.equal(chatServer.getOptions().optionKey1, 'value1');
    assert.equal(chatServer.getOptions().optionKey2, 'value2');

    return new Promise(function(resolve) {
      chatServer.on('start', function() {
        connector.send({
          myChatIdKey: '52',
          myUserIdKey: '62',
          type: 'a_kind_of_magic'
        });
      });
      chatServer.on('message', function(message) {
        assert.equal(message.originalMessage.myChatIdKey, '52');
        assert.equal(message.originalMessage.chatId, '52');
        assert.equal(message.originalMessage.myUserIdKey, '62');
        assert.equal(message.originalMessage.userId, '62');
        assert.equal(message.originalMessage.transport, 'generic');
        assert.equal(message.originalMessage.type, 'a_kind_of_magic');
        assert.equal(message.payload.type, 'a_kind_of_magic');
        assert.equal(message.payload.chatId, '52');
        assert.equal(message.payload.userId, '62');
        assert.equal(message.payload.inbound, true);
        assert.equal(message.payload.transport, 'generic');
        assert.isFunction(message.chat);
        var variables = message.chat().all();
        assert.equal(variables.chatId, '52');
        assert.equal(variables.userId, '62');
        assert.equal(variables.transport, 'generic');
        assert.equal(variables.authorized, false);
        resolve();
      });
      chatServer.start();
    });
  });

  it('should create a simple platform with callbacks', function() {

    var GenericPlatform = new ChatExpress({
      chatIdKey: function(payload) {
        return payload.myChatIdKey;
      },
      userIdKey: function(payload) {
        return payload.myUserIdKey;
      },
      type: function(payload) {
        return payload.type;
      },
      tsKey: function(payload) {
        return moment();
      },
      transport: 'generic',
      inboundMessageEvent: 'message',
      connector: connector,
      debug: false
    });
    var chatServer = GenericPlatform.createServer({
      contextProvider: contextProviders.getProvider('memory')
    });

    return new Promise(function(resolve) {
      chatServer.on('start', function() {
        connector.send({
          myChatIdKey: '52',
          myUserIdKey: '62',
          type: 'a_kind_of_magic'
        });
      });
      chatServer.on('message', function(message) {
        assert.equal(message.originalMessage.myChatIdKey, '52');
        assert.equal(message.originalMessage.myUserIdKey, '62');
        assert.equal(message.originalMessage.type, 'a_kind_of_magic');
        assert.equal(message.payload.type, 'a_kind_of_magic');
        assert.equal(message.payload.chatId, '52');
        assert.equal(message.payload.userId, '62');
        assert.equal(message.payload.inbound, true);
        assert.equal(message.payload.transport, 'generic');
        assert.equal(message.payload.ts.isValid(), true);
        assert.isFunction(message.chat);
        var variables = message.chat().all();
        assert.equal(variables.chatId, '52');
        assert.equal(variables.userId, '62');
        assert.equal(variables.transport, 'generic');
        assert.equal(variables.authorized, false);
        resolve();
      });
      chatServer.start();
    });
  });

  it('should create a platform with middlewares', function() {

    var GenericPlatform = new ChatExpress({
      chatIdKey: 'myChatIdKey',
      userIdKey: 'myUserIdKey',
      transport: 'generic',
      inboundMessageEvent: 'message',
      connector: connector,
      debug: false
    });
    GenericPlatform.use(function(message) {
      message.payload.customKey = 'value';
      return message;
    });
    GenericPlatform.in('a_kind_of_magic', function(message) {
      message.payload.customKey2 = 'value2';
      return message;
    });
    GenericPlatform.in('another_type', function(message) {
      message.payload.customKey2 = 'value3';
      return message;
    });
    GenericPlatform.in(function(message) {
      message.payload.customKey3 = 'value3';
      message.chat().set('customVar', 'ahaha');
      return message;
    });
    GenericPlatform.registerMessageType('a_kind_of_magic', 'A Kind of Magic');

    assert.isTrue(ChatExpress.isSupported('generic'));
    assert.isTrue(ChatExpress.isSupported('generic', 'a_kind_of_magic'));
    assert.isFalse(ChatExpress.isSupported('i_dont_exists'));
    assert.isFalse(ChatExpress.isSupported('generic', 'strange_type'));

    var chatServer = GenericPlatform.createServer({
      contextProvider: contextProviders.getProvider('memory')
    });

    return new Promise(function(resolve) {
      chatServer.on('start', function() {
        connector.send({
          myChatIdKey: '52',
          myUserIdKey: '62',
          type: 'a_kind_of_magic'
        });
      });
      chatServer.on('message', function(message) {
        assert.equal(message.originalMessage.myChatIdKey, '52');
        assert.equal(message.originalMessage.myUserIdKey, '62');
        assert.equal(message.originalMessage.type, 'a_kind_of_magic');
        assert.equal(message.payload.type, 'a_kind_of_magic');
        assert.equal(message.payload.chatId, '52');
        assert.equal(message.payload.userId, '62');
        assert.equal(message.payload.inbound, true);
        assert.equal(message.payload.transport, 'generic');
        assert.equal(message.payload.customKey, 'value');
        assert.equal(message.payload.customKey2, 'value2');
        assert.equal(message.payload.customKey3, 'value3');
        assert.isFunction(message.chat);
        var variables = message.chat().all();
        assert.equal(variables.chatId, '52');
        assert.equal(variables.userId, '62');
        assert.equal(variables.transport, 'generic');
        assert.equal(variables.authorized, false);
        assert.equal(variables.customVar, 'ahaha');
        resolve();
      });
      chatServer.start();
    });
  });

});
