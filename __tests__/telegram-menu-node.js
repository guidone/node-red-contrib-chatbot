const assert = require('chai').assert;
const RED = require('../lib/red-stub')();
const TelegramMenuBlock = require('../nodes/chatbot-telegram-menu');

const COMMANDS = [
  { command: '/start', description: 'Start' },
  { command: '/help', description: 'Help' }
];

describe('Telegram menu node', () => {

  let calls;

  // register a fake Telegram bot config node whose connector records the setMyCommands calls
  const setBot = ({ fail = false } = {}) => {
    calls = [];
    RED.nodes.setNode('telegram-bot', {
      chat: {
        getOptions: () => ({
          connector: {
            setMyCommands: async (commands, form) => {
              calls.push({ commands, form });
              if (fail) {
                throw new Error('Bad Request: language code is invalid');
              }
              return true;
            }
          }
        })
      }
    });
  };

  // run the node and resolve with the argument of done()
  const run = (msg, config, botOptions) => {
    setBot(botOptions);
    RED.node.config({ bot: 'telegram-bot', items: COMMANDS, ...config });
    TelegramMenuBlock(RED);
    return new Promise(resolve => {
      RED.node.get().emit('input', msg, () => {}, error => resolve(error));
    });
  };

  it('sets the default commands when no language is specified', async () => {
    const error = await run(RED.createRawMessage({}));
    assert.isUndefined(error);
    assert.lengthOf(calls, 1);
    assert.deepEqual(calls[0].commands, COMMANDS);
    assert.deepEqual(calls[0].form, {});
  });

  it('sets the commands for the language in the node configuration', async () => {
    const error = await run(RED.createRawMessage({}), { language: 'it' });
    assert.isUndefined(error);
    assert.deepEqual(calls[0].form, { language_code: 'it' });
  });

  it('sets the commands for the language in msg.language', async () => {
    const error = await run(RED.createRawMessage({ language: 'de' }), { language: '' });
    assert.isUndefined(error);
    assert.deepEqual(calls[0].form, { language_code: 'de' });
  });

  it('sets the commands for the language in msg.payload.language', async () => {
    const error = await run(RED.createRawMessage({ payload: { language: 'fr' } }));
    assert.isUndefined(error);
    assert.deepEqual(calls[0].form, { language_code: 'fr' });
  });

  it('gives precedence to the language in the node configuration over msg.language', async () => {
    const error = await run(RED.createRawMessage({ language: 'de' }), { language: 'it' });
    assert.isUndefined(error);
    assert.deepEqual(calls[0].form, { language_code: 'it' });
  });

  it('uses msg.language with msg.commands when the node has no commands', async () => {
    const commands = [{ command: '/aiuto', description: 'Aiuto' }];
    const error = await run(RED.createRawMessage({ language: 'it', commands }), { items: [] });
    assert.isUndefined(error);
    assert.deepEqual(calls[0].commands, commands);
    assert.deepEqual(calls[0].form, { language_code: 'it' });
  });

  it('normalizes a language with region subtag to a two-letter code', async () => {
    const error = await run(RED.createRawMessage({ language: 'pt-BR' }));
    assert.isUndefined(error);
    assert.deepEqual(calls[0].form, { language_code: 'pt' });
  });

  it('rejects an invalid language without calling Telegram', async () => {
    const error = await run(RED.createRawMessage({ language: 'italian' }));
    assert.include(error, 'Invalid language "italian"');
    assert.lengthOf(calls, 0);
  });

  it('reports the Telegram error when setting the commands fails', async () => {
    const error = await run(RED.createRawMessage({ language: 'it' }), {}, { fail: true });
    assert.equal(error, 'Error setting commands in Telegram bot: Bad Request: language code is invalid');
  });

});
