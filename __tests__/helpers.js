const assert = require('chai').assert;
const helpers = require('../lib/helpers/regexps');
const utils = require('../lib/helpers/utils');
const RED = require('../lib/red-stub')();

describe('Helpers functions', () => {

  it('detect a command like message', () => {
    assert.isTrue(helpers.isCommand('/cmd'));
    assert.isTrue(helpers.isCommand('/Cmd'));
    assert.isTrue(helpers.isCommand('/cmd with params'));
    assert.isTrue(helpers.isCommand('/cmd_particular with params', '/cmd_particular'));
    assert.isTrue(helpers.isCommand('/cmd with params', '/cmd'));
    assert.isFalse(helpers.isCommand('I am not a command'));
    assert.isFalse(helpers.isCommand('  trailing spaces'));
    assert.isFalse(helpers.isCommand());
    assert.isFalse(helpers.isCommand('/cmd with params', 'another_cmd'));
  });

  it('detect a url', () => {
    assert.equal(helpers.url('http://www.google.com'), 'http://www.google.com');
    assert.equal(helpers.url('www.google.com'), 'www.google.com');
    assert.isNull(helpers.url('I am not a url'));
    assert.isNull(helpers.url('a text with a url http://www.google.com'), 'http://www.google.com');
  });

  it('detect a number', () => {
    assert.equal(helpers.number('123232312'), '123232312');
    assert.isNull(helpers.url('I am not a number'));
  });

  it('should create a padded string and split into partials', () => {
    const message = 'I am a message';
    let padded = utils.pad(message, 4096);
    padded += 'the beginning of second partial';
    padded = utils.pad(padded, 4096*2);
    padded += 'this is the last partial';

    const partials = utils.split(padded, 4096);

    assert.lengthOf(utils.pad(message, 200), 200);
    assert.lengthOf(partials, 3);
    assert.lengthOf(partials[0], 4096);
    assert.equal(partials[0].substr(0, 14), 'I am a message');
    assert.lengthOf(partials[1], 4096);
    assert.equal(partials[1].substr(0, 31), 'the beginning of second partial');
    assert.lengthOf(partials[2], 24);
    assert.equal(partials[2], 'this is the last partial');
  });

});

describe('Value extractors', () => {

  const extractValue = utils.extractValue;

  it('shoulds extract a params', () => {
    const msg1 = RED.createMessage({ my_params: [
      { platform: 'telegram', name: 'my-value1', value: 42 },
      { platform: 'telegram', name: 'my-value2', value: true },
      { platform: 'telegram', name: 'my-value3', value: 'just a string' },
      { platform: 'slack', name: 'my-chatId', value: '{{chatId}}' }
    ]});
    const msg2 = RED.createMessage([
      { platform: 'telegram', name: 'my-value1', value: 42 },
      { platform: 'telegram', name: 'my-value2', value: true },
      { platform: 'telegram', name: 'my-value3', value: 'just a string' },
      { platform: 'slack', name: 'my-chatId', value: '{{chatId}}' }
    ]);
    const msg3 = RED.createMessage([
      { platform2: 'telegram', name: 'my-value1', value: 42 },
      { platform2: 'telegram', name: 'my-value2', value: true },
      { platform2: 'telegram', name: 'my-value3', value: 'just a string' },
      { platform2: 'slack', name: 'my-chatId', value: '{{chatId}}' }
    ]);
    assert.isArray(extractValue('params', 'my_params', RED.node , msg1), true);
    assert.isArray(extractValue('params', 'my_params', RED.node , msg2), true);
    assert.isNull(extractValue('params', 'my_params', RED.node , msg3));
  });

  it('should extract a boolean', () => {
    const msg1 = RED.createMessage(true);
    const msg2 = RED.createMessage({ aBoolean: true });
    const msg3 = RED.createMessage('wrong type');
    assert.equal(extractValue('boolean', 'aBoolean', RED.node , msg1), true);
    assert.equal(extractValue('boolean', 'aBoolean', RED.node , msg2), true);
    assert.equal(extractValue('boolean', 'aBoolean', RED.node , msg3), null);
  });

  it('should extract an array of entities', () => {
    const entities = [
      { name: 'orange', aliases: ['orange blue', 'orange red'] },
      { name: 'apple', aliases: null }
    ];
    const wrongentities = [
      { name: 'orange', aliases: 'orange blue,orange red' },
      { name: 'apple', aliases: null }
    ];
    const msg1 = RED.createMessage(entities);
    const msg2 = RED.createMessage({ myentity: entities });
    const msg3 = RED.createMessage(wrongentities);
    
    const extract1 = extractValue('arrayOfEntities', 'entities', RED.node , msg1);
    assert.isArray(extract1);
    assert.lengthOf(extract1, 2);
    assert.equal(extract1[0].name, 'orange');
    assert.equal(extract1[1].name, 'apple');

    const extract2 = extractValue('arrayOfEntities', 'myentity', RED.node , msg2);
    assert.isArray(extract2);
    assert.lengthOf(extract2, 2);
    assert.equal(extract2[0].name, 'orange');
    assert.equal(extract2[1].name, 'apple');

    const extract3 = extractValue('arrayOfEntities', 'myentity', RED.node , msg3);
    assert.isNull(extract3);
  });

  it('should extract a string', () => {
    const msg1 = RED.createMessage('I am a string');
    const msg2 = RED.createMessage({ aString: 'I am a string' });
    const msg3 = RED.createMessage(42);
    assert.equal(extractValue('string', 'aString', RED.node , msg1), 'I am a string');
    assert.equal(extractValue('string', 'aString', RED.node , msg2), 'I am a string');
    assert.equal(extractValue('string', 'aString', RED.node , msg3), null);
  });

  it('should extract a buffer', () => {
    const msg1 = RED.createMessage(new Buffer('just a buffer'));
    const msg2 = RED.createMessage({ aBuffer: new Buffer('just a buffer') });
    const msg3 = RED.createMessage(42);
    assert.instanceOf(extractValue('buffer', 'aBuffer', RED.node , msg1), Buffer);
    assert.instanceOf(extractValue('buffer', 'aBuffer', RED.node , msg2), Buffer);
    assert.equal(extractValue('buffer', 'aBuffer', RED.node , msg3), null);
  });

  it('should extract an array', () => {
    const msg1 = RED.createMessage([1, 2, 3]);
    const msg2 = RED.createMessage({ anArray: [1, 2, 3] });
    const msg3 = RED.createMessage(42);
    assert.isArray(extractValue('array', 'anArray', RED.node , msg1));
    assert.equal(extractValue('array', 'anArray', RED.node , msg1)[0], 1);
    assert.equal(extractValue('array', 'anArray', RED.node , msg1)[1], 2);
    assert.equal(extractValue('array', 'anArray', RED.node , msg1)[2], 3);
    assert.isArray(extractValue('array', 'anArray', RED.node , msg1));
    assert.equal(extractValue('array', 'anArray', RED.node , msg2)[0], 1);
    assert.equal(extractValue('array', 'anArray', RED.node , msg2)[1], 2);
    assert.equal(extractValue('array', 'anArray', RED.node , msg2)[2], 3);
    assert.equal(extractValue('array', 'anArray', RED.node , msg3), null);
  });

  it('should extract an array of object', () => {
    const msg1 = RED.createMessage([{}, {}, {}]);
    const msg2 = RED.createMessage({ anArrayOfObject: [{}, {}, {}] });
    const msg3 = RED.createMessage(42);
    assert.isArray(extractValue('arrayOfObject', 'anArrayOfObject', RED.node , msg1));
    assert.isArray(extractValue('arrayOfObject', 'anArrayOfObject', RED.node , msg2));
    assert.equal(extractValue('arrayOfObject', 'anArrayOfObject', RED.node , msg3), null);
  });

  it('should extract an hash', () => {
    const msg1 = RED.createMessage({ randomValue: 42 });
    const msg2 = RED.createMessage({ anHash: { randomValue: 42} });
    const msg3 = RED.createMessage({ chatId: 42});
    assert.isObject(extractValue('hash', 'anHash', RED.node , msg1));
    assert.equal(extractValue('hash', 'anHash', RED.node , msg1).randomValue, 42);
    assert.isObject(extractValue('hash', 'anHash', RED.node , msg2));
    assert.equal(extractValue('hash', 'anHash', RED.node , msg2).randomValue, 42);
    assert.equal(extractValue('hash', 'anHash', RED.node , msg3), null);
  });

  it('should extract string or number (tipically a chatId)', () => {
    const msg1 = RED.createMessage({ chatId: '42' });
    const msg2 = RED.createMessage({ chatId: 42});
    assert.equal(extractValue('stringOrNumber', 'chatId', RED.node , msg1), '42');
    assert.equal(extractValue('stringOrNumber', 'chatId', RED.node , msg2), 42);
  });

  it('should extract filepath', () => {
    const msg = RED.createMessage({ randomValue: 42 });
    const MyNode = { ...RED.node, video: '/web/node-red-contrib-chatbot/__tests__/dummy/audio.mp3' };
    assert.equal(extractValue('filepath', 'video', MyNode, msg), '/web/node-red-contrib-chatbot/__tests__/dummy/audio.mp3');
  });

  it('should extract a string with variables', () => {
    const msg1 = RED.createMessage({ video: 'A simple string' });
    const msg2 = RED.createMessage({ video: 'A simple string with const {{myvar}}' });
    const msg3 = RED.createMessage({ video: 42 });
    const MyNode = { ...RED.node };
    assert.isNull(extractValue('stringWithVariables', 'video', RED.node, msg1));
    assert.equal(extractValue('stringWithVariables', 'video', RED.node, msg2), 'A simple string with const {{myvar}}');
    assert.isNull(extractValue('stringWithVariables', 'video', RED.node, msg3));
  });

  it('should append messages to payload', () => {
    // step 1
    const msg = RED.createMessage({ });
    assert.isEmpty(msg.payload);
    // step 2
    utils.append(msg, { type: 'message', content: 'the message', inbound: false });
    assert.isObject(msg.payload);
    assert.equal(msg.payload.type, 'message');
    assert.equal(msg.payload.content, 'the message');
    // step 3
    utils.append(msg, { type: 'event', content: 'monkey island', inbound: false });
    assert.isArray(msg.payload);
    assert.lengthOf(msg.payload, 2);
    assert.equal(msg.payload[0].type, 'message');
    assert.equal(msg.payload[0].content, 'the message');
    assert.equal(msg.payload[1].type, 'event');
    assert.equal(msg.payload[1].content, 'monkey island');
  });

  it('should not append messages to payload if a message is inbound', () => {
    // step 1
    const msg = RED.createMessage({
      type: 'message',
      content: 'I am a message'
    });

    utils.append(msg, { type: 'message', content: 'the message' });

    assert.isObject(msg.payload);
    assert.equal(msg.payload.type, 'message');
    assert.equal(msg.payload.content, 'the message');
  });

  it('should pad a string', () => {
    const padded = utils.pad('hello', 10);
    assert.lengthOf(padded, 10);
    assert.include(padded, 'hello');
  });

  it('should correctly split a string', () => {
    const str = utils.pad('hello', 10) + utils.pad('what?', 10) + 'done.';
    const splitted = utils.split(str, 10);

    assert.lengthOf(splitted, 3);
    assert.lengthOf(splitted[0], 10);
    assert.include(splitted[0], 'hello');
    assert.lengthOf(splitted[1], 10);
    assert.include(splitted[1], 'what?');
    assert.lengthOf(splitted[2], 5);
    assert.equal(splitted[2], 'done.');
  });

});

