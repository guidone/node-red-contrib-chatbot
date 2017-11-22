var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('./lib/red-stub')();
var ContextProviders = require('../lib/chat-platform/chat-context-factory');
var os = require('os');
var fs = require('fs');
var utils = require('../lib/helpers/utils');
var when = utils.when;

describe('Chat context provider memory', function() {

  it('should create a context provider with some default params', function() {

    var contextProviders = ContextProviders(RED);
    assert.isTrue(contextProviders.hasProvider('memory'));
    var provider = contextProviders.getProvider('memory');
    assert.isFunction(provider.getOrCreate);
    assert.isFunction(provider.get);

    return when(provider.getOrCreate(43, { myVariable: 'initial value'}))
      .then(function(chatContext) {
        assert.isFunction(chatContext.get);
        assert.isFunction(chatContext.set);
        assert.isFunction(chatContext.all);
        assert.isFunction(chatContext.remove);
        assert.isFunction(chatContext.clear);
        return chatContext.get('myVariable');
      }).then(function(myVariable) {
        assert.equal(myVariable, 'initial value');
      });
  });

  it('should set some value and then get and remove it', function() {

    var contextProviders = ContextProviders(RED);
    var provider = contextProviders.getProvider('memory');

    return when(provider.getOrCreate(42, {}))
      .then(function(chatContext) {
        return chatContext.set('firstName', 'Guidone');
      })
      .then(function() {
        return when(provider.get(42).get('firstName'));
      })
      .then(function(firstName) {
        assert.equal(firstName, 'Guidone');
      })
      .then(function() {
        return when(provider.get(42).remove('firstName'));
      })
      .then(function() {
        return when(provider.get(42).get('firstName'));
      })
      .then(
        function() {},
        function(firstName) {
          assert.isUndefined(firstName);
        });
  });

  it('should set some values and then get and remove it', function() {

    var contextProviders = ContextProviders(RED);
    var provider = contextProviders.getProvider('memory');

    return when(provider.getOrCreate(42, {}))
      .then(function(chatContext) {
        return chatContext.set({firstName: 'Guido', lastName: 'Bellomo'});
      })
      .then(function() {
        return when(provider.get(42).get('firstName'));
      })
      .then(function(firstName) {
        assert.equal(firstName, 'Guido');
      })
      .then(function() {
        return when(provider.get(42).get('lastName'));
      })
      .then(function(lastName) {
        assert.equal(lastName, 'Bellomo');
      })
      .then(function() {
        return when(provider.get(42).get('firstName', 'lastName'));
      })
      .then(function(json) {
        assert.isObject(json);
        assert.equal(json.firstName, 'Guido');
        assert.equal(json.lastName, 'Bellomo');
      });
  });

  it('should set some values and get the dump', function() {

    var contextProviders = ContextProviders(RED);
    var provider = contextProviders.getProvider('memory');

    return when(provider.getOrCreate(42, {}))
      .then(function(chatContext) {
        return chatContext.set({firstName: 'Guido', lastName: 'Bellomo', email: 'spam@gmail.com'});
      })
      .then(function() {
        return when(provider.get(42).all());
      })
      .then(function(json) {
        assert.isObject(json);
        assert.equal(json.firstName, 'Guido');
        assert.equal(json.lastName, 'Bellomo');
        assert.equal(json.email, 'spam@gmail.com');
      });
  });

  it('should set some values and remove all', function() {

    var contextProviders = ContextProviders(RED);
    var provider = contextProviders.getProvider('memory');

    return when(provider.getOrCreate(42, {}))
      .then(function(chatContext) {
        return chatContext.set({firstName: 'Guido', lastName: 'Bellomo'});
      })
      .then(function() {
        return when(provider.get(42).clear());
      })
      .then(function() {
        return when(provider.get(42).all());
      })
      .then(function(json) {
        assert.isObject(json);
        assert.isTrue(_.isEmpty(json));
      });
  });

});
