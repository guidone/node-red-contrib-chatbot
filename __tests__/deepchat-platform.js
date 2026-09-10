const assert = require('chai').assert;
const express = require('express');
const http = require('http');
const { ContextProviders } = require('chat-platform');

const DeepChatServer = require('../lib/platforms/deepchat');
const RedStub = require('../lib/red-stub');

// minimal http client, avoids adding a dependency just for the tests
const call = (port, path, options = {}) => new Promise((resolve, reject) => {
  let body = null;
  let headers = {};
  if (options.raw != null) {
    body = options.raw;
    headers = { 'Content-Type': options.contentType, 'Content-Length': body.length };
  } else if (options.body != null) {
    body = Buffer.from(JSON.stringify(options.body));
    headers = { 'Content-Type': 'application/json', 'Content-Length': body.length };
  }
  const request = http.request({
    port,
    path,
    method: options.method || 'GET',
    headers
  }, response => {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => resolve({
      statusCode: response.statusCode,
      headers: response.headers,
      body: Buffer.concat(chunks).toString('utf8')
    }));
  });
  request.on('error', reject);
  if (body != null) {
    request.write(body);
  }
  request.end();
});

describe('Deep Chat platform', function() {

  let app;
  let server;
  let port;
  let chatServer;

  beforeAll(function(done) {
    const RED = RedStub();
    app = express();
    RED.httpNode = app;
    RED.settings.get = () => '1880';
    RED.settings.uiPort = '1880';

    const contextProvider = ContextProviders(RED).getProvider('memory', {});
    contextProvider.start();

    chatServer = DeepChatServer.createServer({
      botId: 'test-bot',
      botname: 'Test Bot',
      contextProvider,
      timeout: 800,
      collectWindow: 40,
      debug: false,
      RED
    });
    chatServer.start();

    server = http.createServer(app);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll(function(done) {
    chatServer.stop().then(() => server.close(done), () => server.close(done));
  });

  // a flow answers by re-using the inbound message, like the RedBot nodes do
  const reply = (message, payload) => chatServer.send({
    ...message,
    payload: { ...payload, chatId: message.payload.chatId, inbound: false }
  });

  afterEach(function() {
    if (chatServer != null) {
      chatServer.removeAllListeners('message');
    }
  });

  it('serves the test page with a widget wired to the bot endpoint', async function() {
    const response = await call(port, '/redbot/deepchat/test-bot/widget');
    assert.equal(response.statusCode, 200);
    assert.include(response.headers['content-type'], 'text/html');
    assert.include(response.body, "createElement('deep-chat')");
    assert.include(response.body, 'deepChat.bundle.js');
    // the endpoint the widget will post to
    assert.include(response.body, '"/redbot/deepchat/test-bot"');
  });

  it('replies with 404 to the widget of another bot', async function() {
    const response = await call(port, '/redbot/deepchat/another-bot/widget');
    assert.equal(response.statusCode, 404);
  });

  it('forwards an inbound message to the flow and answers with what the flow produced', async function() {
    chatServer.on('message', message => {
      assert.equal(message.payload.type, 'message');
      assert.equal(message.payload.content, 'hello');
      assert.equal(message.payload.chatId, 'chat-42');
      reply(message, { type: 'message', content: 'hello back' });
    });

    const response = await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'hello' }], chatId: 'chat-42', userId: 'chat-42' }
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), [{ text: 'hello back', role: 'ai' }]);
  });

  it('collects more than one message of the flow in the same response', async function() {
    chatServer.on('message', message => {
      reply(message, { type: 'message', content: 'one' })
        .then(() => reply(message, { type: 'message', content: 'two' }));
    });

    const response = await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'hello' }], chatId: 'chat-multi' }
    });

    assert.deepEqual(JSON.parse(response.body), [
      { text: 'one', role: 'ai' },
      { text: 'two', role: 'ai' }
    ]);
  });

  it('renders inline buttons as Deep Chat suggestion buttons', async function() {
    chatServer.on('message', message => {
      reply(message, {
        type: 'inline-buttons',
        content: 'Pick one',
        buttons: [
          { type: 'postback', label: 'Yes', value: 'yes-value' },
          { type: 'url', label: 'Docs', url: 'https://deepchat.dev' }
        ]
      });
    });

    const response = await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'hello' }], chatId: 'chat-buttons' }
    });

    const [answer] = JSON.parse(response.body);
    assert.include(answer.html, 'deep-chat-suggestion-button');
    assert.include(answer.html, '>Yes</button>');
    assert.include(answer.html, 'https://deepchat.dev');
    assert.include(answer.html, 'Pick one');
  });

  it('translates the label of a suggestion button back into the value of the button', async function() {
    const received = [];
    chatServer.on('message', message => {
      received.push(message.payload.content);
      if (received.length === 1) {
        reply(message, {
          type: 'inline-buttons',
          content: 'Pick one',
          buttons: [{ type: 'postback', label: 'Yes', value: 'yes-value' }]
        });
      } else {
        reply(message, { type: 'message', content: 'done' });
      }
    });

    await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'hello' }], chatId: 'chat-postback', userId: 'chat-postback' }
    });
    // Deep Chat submits the label of the button as a plain user message
    await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'Yes' }], chatId: 'chat-postback', userId: 'chat-postback' }
    });

    assert.deepEqual(received, ['hello', 'yes-value']);
  });

  it('serves the media sent by the flow and links it in the response', async function() {
    const buffer = Buffer.from('89504e470d0a1a0a', 'hex');
    chatServer.on('message', message => {
      reply(message, {
        type: 'photo',
        content: buffer,
        filename: 'pixel.png',
        mimeType: 'image/png'
      });
    });

    const response = await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'a picture please' }], chatId: 'chat-media' }
    });

    const [answer] = JSON.parse(response.body);
    assert.equal(answer.files[0].type, 'image');
    assert.equal(answer.files[0].name, 'pixel.png');
    assert.match(answer.files[0].src, /^\/redbot\/deepchat\/test-bot\/files\/[a-f0-9]{32}$/);

    const file = await call(port, answer.files[0].src);
    assert.equal(file.statusCode, 200);
    assert.include(file.headers['content-type'], 'image/png');
  });

  it('replies with an empty list when the flow doesn\'t answer', async function() {
    const response = await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'anybody there?' }], chatId: 'chat-silent' }
    });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), []);
  });

  it('delivers the messages sent out of band with the next message of the user', async function() {
    // no listener: the first request times out empty, but the flow pushes a message meanwhile
    chatServer.send({ payload: { type: 'message', content: 'ping from the flow', chatId: 'chat-push' } });

    const response = await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      body: { messages: [{ role: 'user', text: 'hi' }], chatId: 'chat-push' }
    });
    assert.deepEqual(JSON.parse(response.body), [{ text: 'ping from the flow', role: 'ai' }]);
  });

  it('forwards the files attached by the user to the flow', async function() {
    const boundary = '----redbottest';
    const png = Buffer.from('89504e470d0a1a0a', 'hex');
    const raw = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="pixel.png"\r\n`
        + 'Content-Type: image/png\r\n\r\n'),
      png,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="chatId"\r\n\r\nchat-upload\r\n`
        + `--${boundary}\r\nContent-Disposition: form-data; name="message1"\r\n\r\n`
        + '{"role":"user","text":"look at this"}\r\n'
        + `--${boundary}--\r\n`)
    ]);

    let received = null;
    chatServer.on('message', message => {
      received = message;
      reply(message, { type: 'message', content: 'nice picture' });
    });

    const response = await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      raw,
      contentType: `multipart/form-data; boundary=${boundary}`
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), [{ text: 'nice picture', role: 'ai' }]);
    assert.equal(received.payload.type, 'photo');
    assert.equal(received.payload.chatId, 'chat-upload');
    assert.equal(received.payload.filename, 'pixel.png');
    assert.equal(received.payload.mimeType, 'image/png');
    assert.equal(received.payload.caption, 'look at this');
    assert.isTrue(Buffer.isBuffer(received.payload.content));
    assert.equal(received.payload.content.toString('hex'), png.toString('hex'));
  });

  it('refuses an empty message', async function() {
    const response = await call(port, '/redbot/deepchat/test-bot', {
      method: 'POST',
      body: { messages: [], chatId: 'chat-empty' }
    });
    assert.equal(response.statusCode, 400);
  });

  it('refuses a GET on the message endpoint', async function() {
    const response = await call(port, '/redbot/deepchat/test-bot');
    assert.equal(response.statusCode, 405);
  });

});
