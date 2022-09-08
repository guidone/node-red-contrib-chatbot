const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const SlackBlocksBlock = require('../nodes/chatbot-slack-blocks');

describe('Chat Slack Blocks node', () => {

  it('should parse a slack block', () => {
    const msg = RED.createMessage({}, 'slack');
    RED.node.clear();
    RED.node.config({
      blocks: '{ "blocks": [ { "block_id": 1, "label": "The value is {{my_value}}" }]}'
    });
    msg.chat().set('my_value', '43');
    SlackBlocksBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const { payload } = RED.node.message();
        assert.equal(payload.type, 'blocks');
        assert.equal(payload.chatId, 42);
        assert.equal(payload.inbound, false);
        assert.isUndefined(payload.text);
        assert.isArray(payload.content);
        assert.lengthOf(payload.content, 1);
        assert.equal(payload.content[0].label, 'The value is 43');
      });
  });

  it('should parse a slack block with fallback', () => {
    const msg = RED.createMessage({}, 'slack');
    RED.node.clear();
    RED.node.config({
      blocks: '{ "text": "failback text", "blocks": [ { "block_id": 1, "label": "The value is {{my_value}}" }]}'
    });
    msg.chat().set('my_value', '43');
    SlackBlocksBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const { payload } = RED.node.message();
        assert.equal(payload.type, 'blocks');
        assert.equal(payload.chatId, 42);
        assert.equal(payload.inbound, false);
        assert.equal(payload.text, 'failback text');
        assert.isArray(payload.content);
        assert.lengthOf(payload.content, 1);
        assert.equal(payload.content[0].label, 'The value is 43');
      });
  });

  it('should parse a slack block passed from payload', () => {
    const msg = RED.createMessage({
      blocks: '{ "blocks": [ { "block_id": 1, "label": "The value is {{my_value}}" }]}'
    }, 'slack');
    RED.node.clear();
    RED.node.config({});
    msg.chat().set('my_value', '43');
    SlackBlocksBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(() => {
        const { payload } = RED.node.message();
        assert.equal(payload.type, 'blocks');
        assert.equal(payload.chatId, 42);
        assert.equal(payload.inbound, false);
        assert.isArray(payload.content);
        assert.lengthOf(payload.content, 1);
        assert.equal(payload.content[0].label, 'The value is 43');
      });
  });

  it('should fail on telegram', () => {
    const msg = RED.createMessage({}, 'telegram');
    RED.node.clear();
    RED.node.config({
      blocks: '{ "blocks": [ { "block_id": 1, "label": "The value is {{my_value}}" }]}'
    });
    msg.chat().set('my_value', '43');
    SlackBlocksBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {},
        () => {
          assert.include(RED.node.error(), 'Node "blocks" is not supported by telegram transport');
        }
      );
  });

  it('should fail on wrong json', () => {
    const msg = RED.createMessage({}, 'slack');
    RED.node.clear();
    RED.node.config({
      blocks: '{ "blocks": [ { "block_id": 1, "label" "The value is {{my_value}}" }]}'
    });
    msg.chat().set('my_value', '43');
    SlackBlocksBlock(RED);
    RED.node.get().emit('input', msg);
    return RED.node.get().await()
      .then(
        () => {},
        () => {
          assert.include(RED.node.error().toString(), 'Unexpected string in JSON at position');
        }
      );
  });

});
