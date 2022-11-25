const assert = require('chai').assert;
const mergeNotEmpty = require('../lib/helpers/merge-not-empty');

describe('Helpers functions 2', () => {

  it('detect a command like message', () => {
    const obj1 = mergeNotEmpty({ id1: 1 }, { id2: 2 }, { id3: 3});
    assert.hasAllKeys(obj1, ['id1', 'id2', 'id3']);
    assert.equal(obj1.id1, 1);
    assert.equal(obj1.id2, 2);
    assert.equal(obj1.id3, 3);

    const obj2 = mergeNotEmpty({ id: 1 }, { id: '2' }, { id: 'id'});
    assert.hasAllKeys(obj2, ['id']);
    assert.equal(obj2.id, 'id');

    const obj3 = mergeNotEmpty({ chatbotId: 'my-bot' }, { chatbotId: null }, { chatbotId: '' });
    assert.hasAllKeys(obj3, ['chatbotId']);
    assert.equal(obj3.chatbotId, 'my-bot');
  });

});
