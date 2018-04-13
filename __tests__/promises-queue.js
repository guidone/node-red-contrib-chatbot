var _ = require('underscore');
var assert = require('chai').assert;
var RED = require('../lib/red-stub')();
var ActionBlock = require('../nodes/chatbot-waiting');

var PromisesQueue = require('../lib/promises-queue');

describe('Promises Queue', function() {

  it('it should easily resolve one promise', function() {
    var stack = '';

    var queue = new PromisesQueue();
    var task = queue.add(function(resolve) {
      stack += 'start1';
      setTimeout(function() {
        stack += 'end1';
        resolve();
      }, 100);
    });

    return task
      .then(function() {
        assert.equal(stack, 'start1end1');
        assert.equal(queue.count(), 0);
      });
  });

  it('it should easily resolve one promise after the first already started is completed', function() {
    var stack = '';

    var queue = new PromisesQueue();
    queue.add(function(resolve) {
      stack += 'start1';
      setTimeout(function() {
        stack += 'end1';
        resolve();
      }, 100);
    });
    var task = queue.add(function(resolve) {
      stack += 'start2';
      setTimeout(function() {
        stack += 'end2';
        resolve();
      }, 100);
    });


    return task
      .then(function() {
        assert.equal(stack, 'start1end1start2end2');
        assert.equal(queue.count(), 0);
      });
  });

  it('it should easily resolve one promise after the two in the queue are completed', function() {
    var stack = '';

    var queue = new PromisesQueue();
    queue.add(function(resolve) {
      stack += 'start1';
      setTimeout(function() {
        stack += 'end1';
        resolve();
      }, 100);
    });
    queue.add(function(resolve) {
      stack += 'start2';
      setTimeout(function() {
        stack += 'end2';
        resolve();
      }, 100);
    });
    var task = queue.add(function(resolve) {
      stack += 'start3';
      setTimeout(function() {
        stack += 'end3';
        resolve();
      }, 100);
    });

    return task
      .then(function() {
        assert.equal(stack, 'start1end1start2end2start3end3');
        assert.equal(queue.count(), 0);
      });
  });

  it('it should easily resolve one promise after the three in the queue are completed', function() {
    var stack = '';

    var queue = new PromisesQueue();
    queue.add(function(resolve) {
      stack += 'start1';
      setTimeout(function() {
        stack += 'end1';
        resolve();
      }, 100);
    });
    queue.add(function(resolve) {
      stack += 'start2';
      setTimeout(function() {
        stack += 'end2';
        resolve();
      }, 100);
    });
    queue.add(function(resolve) {
      stack += 'start3';
      setTimeout(function() {
        stack += 'end3';
        resolve();
      }, 100);
    });
    var task = queue.add(function(resolve) {
      stack += 'start4';
      setTimeout(function() {
        stack += 'end4';
        resolve();
      }, 100);
    });

    return task
      .then(function() {
        assert.equal(stack, 'start1end1start2end2start3end3start4end4');
        assert.equal(queue.count(), 0);
      });
  });


});

