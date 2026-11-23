/* global jest */
const assert = require('chai').assert;
const { ContextProviders } = require('chat-platform');
const Telegram = require('../lib/platforms/telegram');
const RedStub = require('../lib/red-stub');
const { execFileSync } = require('child_process');

const reaction = (oldReaction, newReaction, actor = { user: { id: 17, first_name: 'Ada' } }) => ({
  chat: { id: 42, type: 'supergroup' },
  message_id: 88,
  date: 1700000000,
  old_reaction: oldReaction,
  new_reaction: newReaction,
  ...actor
});
const count = () => ({
  chat: { id: 42, type: 'supergroup' },
  message_id: 88,
  date: 1700000000,
  reactions: [{ type: { type: 'emoji', emoji: '👍' }, total_count: 4 }]
});
const normal = () => ({
  chat: { id: 42 }, from: { id: 17, first_name: 'Ada' },
  message_id: 89, date: 1700000000, text: 'hello'
});

const createServer = () => {
  const RED = RedStub();
  const contextProvider = ContextProviders(RED).getProvider('memory');
  contextProvider.start();
  return Telegram.createServer({ RED, token: 'test-token', contextProvider });
};
const webhook = (server, body) => {
  const send = jest.fn();
  server.getOptions().routes['/redbot/telegram'].call(server, { body }, { send });
  assert.deepEqual(send.mock.calls, [[{ status: 'ok' }]]);
};

// Keep the entire inbound pipeline in the test, including ChatExpress context creation.
const receive = (server, trigger) => new Promise((resolve, reject) => {
  const onError = error => {
    server.removeListener('message', onMessage);
    reject(error);
  };
  const onMessage = message => {
    server.removeListener('error', onError);
    resolve(message);
  };
  server.once('message', onMessage);
  server.once('error', onError);
  trigger();
});

describe('Telegram reaction updates', () => {
  it('subscribes to reactions and ordinary updates in both connection modes', () => {
    // Run outside Jest's VM so the platform's native dynamic import executes normally.
    const script = `
      const Telegram = require('./lib/platforms/telegram');
      (async () => {
        const Bot = (await import('node-telegram-bot-api')).default;
        Bot.prototype.setWebhook = async function(url, options) { this.webhook = { url, options }; };
        Bot.prototype.getUpdates = () => new Promise(() => {});
        const server = Telegram.createServer({ token: 'test-token', connectMode: 'webHook', webHook: 'https://example.org/hook' });
        const options = server.getOptions();
        await options.onStart.call(server);
        const webhook = options.connector.webhook;
        options.connectMode = 'polling';
        await options.onStart.call(server);
        console.log(JSON.stringify({ webhook, polling: options.connector.options.polling.params.allowed_updates }));
      })().catch(error => { console.error(error); process.exitCode = 1; });
    `;
    const { webhook: hook, polling } = JSON.parse(execFileSync(process.execPath, ['-e', script], { cwd: process.cwd() }).toString());
    assert.equal(hook.url, 'https://example.org/hook');
    assert.deepEqual(polling, hook.options.allowed_updates);
    assert.includeMembers(polling, [
      'message_reaction', 'message_reaction_count', 'message', 'edited_message',
      'channel_post', 'callback_query', 'inline_query', 'pre_checkout_query',
      'shipping_query', 'business_message', 'purchased_paid_media'
    ]);
    assert.notInclude(polling, 'chat_member');
  });

  for (const [updateType, sample] of [
    ['message_reaction', () => reaction([], [{ type: 'emoji', emoji: '👍' }])],
    ['message_reaction_count', count]
  ]) {
    it(`routes ${updateType} exactly once via webhook and polling`, () => {
      const server = createServer();
      const receiveSpy = jest.spyOn(server, 'receive').mockImplementation(() => {});
      const update = sample();
      webhook(server, { [updateType]: update });
      assert.equal(receiveSpy.mock.calls.length, 1);
      const fromWebhook = receiveSpy.mock.calls[0][0];
      receiveSpy.mockClear();
      server.getOptions().events[updateType].call(server, update);
      assert.equal(receiveSpy.mock.calls.length, 1);
      assert.deepEqual(receiveSpy.mock.calls[0][0], fromWebhook);
      assert.equal(fromWebhook._reactionEventType, updateType === 'message_reaction' ? 'reaction' : 'reaction-count');
    });
  }

  it('produces equivalent inbound events for webhook and polling updates', async () => {
    const server = createServer();
    for (const [kind, eventType, update] of [
      ['message_reaction', 'reaction', reaction([], [{ type: 'emoji', emoji: '👍' }])],
      ['message_reaction_count', 'reaction-count', count()]
    ]) {
      const fromWebhook = await receive(server, () => webhook(server, { [kind]: update }));
      const fromPolling = await receive(server, () => server.getOptions().events[kind].call(server, update));
      assert.equal(fromWebhook.payload.eventType, eventType);
      assert.deepEqual(fromPolling.payload, fromWebhook.payload);
      assert.deepEqual(fromPolling.originalMessage, fromWebhook.originalMessage);
    }
  });

  it('normalizes added, removed, and changed user reactions without losing raw data', async () => {
    const server = createServer();
    const emoji = { type: 'emoji', emoji: '👍' };
    const heart = { type: 'emoji', emoji: '❤️' };
    for (const [previous, next] of [[[], [emoji]], [[emoji], []], [[emoji], [heart]]]) {
      const update = reaction(previous, next);
      const message = await receive(server, () => webhook(server, { message_reaction: update }));
      assert.equal(message.payload.type, 'event');
      assert.equal(message.payload.eventType, 'reaction');
      assert.equal(message.payload.chatId, 42);
      assert.equal(message.originalMessage.user.id, 17);
      assert.equal(message.payload.messageId, 88);
      assert.deepEqual(message.payload.oldReaction, previous);
      assert.deepEqual(message.payload.newReaction, next);
      assert.deepEqual(message.payload.actor, update.user);
      assert.deepEqual(message.originalMessage.old_reaction, previous);
      assert.equal(message.payload.ts, '2023-11-14T22:13:20.000Z');
    }
  });

  it('preserves actor-chat-only reactions without attributing them to a user', async () => {
    const server = createServer();
    const update = reaction([], [{ type: 'emoji', emoji: '👍' }], { actor_chat: { id: 53, title: 'Anonymous group' } });
    const message = await receive(server, () => server.getOptions().events.message_reaction.call(server, update));
    assert.equal(message.payload.eventType, 'reaction');
    assert.deepEqual(message.payload.actorChat, update.actor_chat);
    assert.isUndefined(message.payload.actor);
    assert.equal(message.payload.userId, 'telegram:reaction-chat:42');
    assert.deepEqual(message.originalMessage.actor_chat, update.actor_chat);
  });

  it('accepts anonymous reaction counts and ordinary messages through inbound context', async () => {
    const server = createServer();
    const update = count();
    const message = await receive(server, () => webhook(server, { message_reaction_count: update }));
    assert.equal(message.payload.type, 'event');
    assert.equal(message.payload.eventType, 'reaction-count');
    assert.equal(message.payload.messageId, 88);
    assert.deepEqual(message.payload.reactions, update.reactions);
    assert.isUndefined(message.payload.actor);
    assert.equal(message.payload.userId, 'telegram:reaction-chat:42');
    const regular = await receive(server, () => webhook(server, { message: normal() }));
    assert.equal(regular.payload.type, 'message');
    assert.equal(regular.originalMessage.from.id, 17);
    assert.equal(regular.payload.content, 'hello');
  });

  it('preserves ordinary webhook and polling message and callback handling', () => {
    const server = createServer();
    const receiveSpy = jest.spyOn(server, 'receive').mockImplementation(() => {});
    const callbackSpy = jest.spyOn(server, 'callbackQuery').mockImplementation(() => {});
    const msg = normal();
    webhook(server, { message: msg });
    assert.equal(receiveSpy.mock.calls.length, 1);
    assert.deepEqual(receiveSpy.mock.calls[0][0], msg);
    const callback = { id: 'callback-1', from: { id: 17 } };
    webhook(server, { callback_query: callback });
    assert.deepEqual(callbackSpy.mock.calls[0][0], callback);
    server.getOptions().events.callback_query.call(server, callback);
    assert.deepEqual(callbackSpy.mock.calls[1][0], callback);
  });
});
