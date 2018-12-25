var _ = require('underscore');
var assert = require('chai').assert;
var helpers = require('../lib/platforms/twilio/helpers');
var fixNumber = helpers.fixNumber;


describe('Twilio helpers functions', function() {

  it('fix a number with a "+" unless there is a scheme', function() {

    assert.equal(fixNumber('+391234567'), '+391234567');
    assert.equal(fixNumber('391234567'), '+391234567');
    assert.equal(fixNumber('scheme:391234567'), 'scheme:+391234567');
    assert.equal(fixNumber('scheme:+391234567'), 'scheme:+391234567');



  });

});

