var _ = require('underscore');
var assert = require('chai').assert;
var fetchers = require('../lib/helpers/fetchers');

describe('Validators', function() {

  it('file fetcher', function() {
    return fetchers.file(__dirname + '/dummy/file.mp4')
      .then(function(buffer) {
        assert.instanceOf(buffer, Buffer);
      });
  });

  it('identity fetcher', function() {
    return fetchers.identity('my string')
      .then(function(value) {
        assert.equal(value, 'my string');
      });
  });

});

