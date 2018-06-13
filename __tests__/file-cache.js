var _ = require('underscore');
var assert = require('chai').assert;
var FileCache = require('../lib/file-cache');

describe('File Cache', function() {

  it('create a file cache with two files', function() {

    var cache = new FileCache();

    return cache.store('1', new Buffer('aaa3'))
      .then(function() {
        return cache.store('2', new Buffer('bbbb4'))
      })
      .then(function() {
        assert.equal(cache.count(), 2);
        return cache.get('1');
      })
      .then(function(value) {
        console.log('value', value.buffer.toString());
        assert.instanceOf(value.buffer, Buffer);
        assert.equal(value.buffer.toString(), 'aaa3');
        return cache.exists('1');
      })
      .then(function(value) {
        assert.isTrue(value);
        return cache.exists('2');
      })
      .then(function(value) {
        assert.isTrue(value);
        return cache.exists('3');
      })
      .then(function(value) {
        assert.isFalse(value);
      });

  });

  it('create a file cache with one file and remove after use', function() {

    var cache = new FileCache();

    return cache.store('1', new Buffer('aaa3'))

      .then(function () {
        assert.equal(cache.count(), 1);
        return cache.get('1', { remove: true });
      })
      .then(function (value) {
        assert.instanceOf(value.buffer, Buffer);
        assert.equal(value.buffer.toString(), 'aaa3');
        assert.isFalse(cache.exists('1'));
        assert.equal(cache.count(), 0);
      });
  });

  it('create a file cache with one file and remove after use in config', function() {

    var cache = new FileCache();

    return cache.store('1', new Buffer('aaa3'), {removeAfterUse: true})

      .then(function () {
        assert.equal(cache.count(), 1);
        return cache.get('1');
      })
      .then(function (value) {
        assert.instanceOf(value.buffer, Buffer);
        assert.equal(value.buffer.toString(), 'aaa3');
        assert.isFalse(cache.exists('1'));
        assert.equal(cache.count(), 0);
      });
  });

});
