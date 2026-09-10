const assert = require('chai').assert;
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { ContextProviders } = require('chat-platform');

const DeepChatServer = require('../lib/platforms/deepchat');
const RedStub = require('../lib/red-stub');

const send = (socket, text) => socket.send(JSON.stringify({ messages: [{ role: 'user', text }] }));

// a minimal http POST, the message endpoint stays available in WebSocket mode
const post = (port, path, body) => new Promise((resolve, reject) => {
  const payload = Buffer.from(JSON.stringify(body));
  const request = http.request({
    port,
    path,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': payload.length }
  }, response => {
    const chunks = [];
    response.on('data', chunk => chunks.push(chunk));
    response.on('end', () => resolve({
      statusCode: response.statusCode,
      body: Buffer.concat(chunks).toString('utf8')
    }));
  });
  request.on('error', reject);
  request.write(payload);
  request.end();
});

describe('Deep Chat platform, WebSocket mode', function() {

  let app;
  let server;
  let port;
  let chatServer;
  let restricted;
  const sockets = [];
  // every raw connection of the server: an upgrade request that matched no endpoint is left alone on
  // purpose, and Node keeps its socket around forever, so the teardown has to destroy them by hand
  const rawSockets = [];

  /**
   * Open a socket and resolve when the handshake completed. The frames are collected from the very
   * beginning: the bot may push something the moment it sees the connection (the messages buffered while
   * the conversation was offline), before the client emits "open"
   */
  const open = (path, options = {}) => {
    const socket = new WebSocket(`ws://localhost:${port}${path}`, {
      // nobody ever answers an upgrade request that matches no endpoint: without a timeout a connection
      // to a path that is not mounted would just wait forever
      handshakeTimeout: 800,
      ...options
    });
    const frames = [];
    socket.on('message', data => frames.push(JSON.parse(String(data))));
    socket.frames = frames;
    socket.waitFor = (count, timeout = 1500) => new Promise((resolve, reject) => {
      const started = Date.now();
      const check = () => {
        if (frames.length >= count) {
          // give a beat to any further frame, so that "exactly N" can be asserted
          setTimeout(() => resolve(frames), 30);
        } else if (Date.now() - started > timeout) {
          reject(new Error(`Timeout: got ${frames.length} frames out of ${count}`));
        } else {
          setTimeout(check, 10);
        }
      };
      check();
    });
    return new Promise((resolve, reject) => {
      socket.on('open', () => {
        sockets.push(socket);
        resolve(socket);
      });
      socket.on('error', error => reject(error));
    });
  };

  beforeAll(function(done) {
    const RED = RedStub();
    app = express();
    RED.httpNode = app;
    RED.settings.get = () => '1880';
    RED.settings.uiPort = '1880';
    // WebSocket endpoints are mounted on the raw server, not on the Express instance
    server = http.createServer(app);
    server.on('connection', socket => rawSockets.push(socket));
    RED.server = server;

    const contextProvider = ContextProviders(RED).getProvider('memory', {});
    contextProvider.start();

    chatServer = DeepChatServer.createServer({
      botId: 'test-ws-bot',
      botname: 'Test WS Bot',
      connectMode: 'websocket',
      heartbeat: 0,
      contextProvider,
      debug: false,
      RED
    });
    // a second bot on the same server, with an origin policy: proves the endpoints stay apart
    restricted = DeepChatServer.createServer({
      botId: 'other-ws-bot',
      botname: 'Other WS Bot',
      connectMode: 'websocket',
      heartbeat: 0,
      allowedOrigins: 'https://allowed.example.com',
      contextProvider,
      debug: false,
      RED
    });
    // nothing subscribes to the errors of a chat server in the tests
    chatServer.on('error', () => {});
    restricted.on('error', () => {});

    server.listen(0, async () => {
      port = server.address().port;
      await chatServer.start();
      await restricted.start();
      done();
    });
  });

  afterAll(function(done) {
    const close = () => {
      rawSockets.forEach(socket => socket.destroy());
      server.close(done);
    };
    Promise.all([chatServer.stop(), restricted.stop()]).then(close, close);
  });

  afterEach(function() {
    chatServer.removeAllListeners('message');
    restricted.removeAllListeners('message');
    while (sockets.length !== 0) {
      const socket = sockets.pop();
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    }
  });

  // a flow answers by re-using the inbound message, like the RedBot nodes do
  const reply = (message, payload) => chatServer.send({
    ...message,
    payload: { ...payload, chatId: message.payload.chatId, inbound: false }
  });

  it('forwards an inbound frame to the flow and answers on the socket', async function() {
    chatServer.on('message', message => {
      assert.equal(message.payload.type, 'message');
      assert.equal(message.payload.content, 'hello');
      assert.equal(message.payload.chatId, 'chat-ws-1');
      assert.equal(message.payload.userId, 'user-ws-1');
      reply(message, { type: 'message', content: `you said ${message.payload.content}` });
    });

    const socket = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-1&userId=user-ws-1');
    send(socket, 'hello');

    await socket.waitFor(1);
    assert.deepEqual(socket.frames, [{ text: 'you said hello', role: 'ai' }]);
  });

  it('pushes every message of the flow as it comes, with no collecting window', async function() {
    chatServer.on('message', async message => {
      await reply(message, { type: 'message', content: 'first' });
      await reply(message, { type: 'message', content: 'second' });
      await reply(message, { type: 'message', content: 'third' });
    });

    const socket = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-2');
    send(socket, 'hello');

    await socket.waitFor(3);
    assert.deepEqual(socket.frames.map(frame => frame.text), ['first', 'second', 'third']);
  });

  it('sends the waiting status of the flow as a temporary message', async function() {
    chatServer.on('message', async message => {
      await reply(message, { type: 'action', waitingType: 'upload_photo' });
      await reply(message, { type: 'message', content: 'here it is' });
    });

    const socket = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-waiting');
    send(socket, 'send me a photo');

    await socket.waitFor(2);
    const [waiting, answer] = socket.frames;
    // Deep Chat drops a temporary message as soon as the next one arrives, the lifetime of a typing dots
    assert.include(waiting.html, 'deep-chat-temporary-message');
    assert.include(waiting.html, 'Uploading a photo');
    assert.include(waiting.html, 'redbot-waiting-dots');
    assert.deepEqual(answer, { text: 'here it is', role: 'ai' });
  });

  it('defaults the waiting status to plain typing, with no label', async function() {
    chatServer.on('message', message => reply(message, { type: 'action' }));

    const socket = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-typing');
    send(socket, 'hello');

    await socket.waitFor(1);
    const [waiting] = socket.frames;
    assert.include(waiting.html, 'deep-chat-temporary-message');
    assert.notInclude(waiting.html, 'redbot-waiting-label');
  });

  it('buffers what the flow sends out of band and delivers it on reconnection', async function() {
    let inbound = null;
    chatServer.on('message', message => { inbound = message; });

    const first = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-3');
    send(first, 'hello');
    await new Promise(resolve => setTimeout(resolve, 100));
    assert.isNotNull(inbound);

    // the visitor closes the page, then the flow answers
    await new Promise(resolve => {
      first.on('close', resolve);
      first.close();
    });
    await reply(inbound, { type: 'message', content: 'late answer' });

    // ...and comes back with the same chat id
    const second = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-3');

    await second.waitFor(1);
    assert.deepEqual(second.frames, [{ text: 'late answer', role: 'ai' }]);
  });

  it('sends the buttons and translates the label the widget sends back into the value', async function() {
    const received = [];
    chatServer.on('message', message => {
      received.push(message.payload.content);
      if (received.length === 1) {
        reply(message, {
          type: 'inline-buttons',
          content: 'Pick one',
          buttons: [{ type: 'postback', label: 'The label', value: 'the-value' }]
        });
      }
    });

    const socket = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-4');
    send(socket, 'hello');
    await socket.waitFor(1);
    assert.include(socket.frames[0].html, 'The label');

    // the suggestion button submits its label, the flow must see the value
    send(socket, 'The label');
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.deepEqual(received, ['hello', 'the-value']);
  });

  it('keeps one socket per conversation, the last one wins', async function() {
    chatServer.on('message', message => reply(message, { type: 'message', content: 'answer' }));

    const first = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-5');
    const closed = new Promise(resolve => first.on('close', code => resolve(code)));

    const second = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-5');
    assert.equal(await closed, 4000);

    send(second, 'hello');
    await second.waitFor(1);
    assert.deepEqual(second.frames.map(frame => frame.text), ['answer']);
    assert.lengthOf(first.frames, 0);
  });

  it('answers a message posted on the http endpoint over the socket', async function() {
    chatServer.on('message', message => reply(message, { type: 'message', content: 'from http' }));

    const socket = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-6');

    const response = await post(port, '/redbot/deepchat/test-ws-bot', {
      chatId: 'chat-ws-6',
      messages: [{ role: 'user', text: 'hello' }]
    });
    // the flow doesn't answer on the response in WebSocket mode
    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), []);

    await socket.waitFor(1);
    assert.deepEqual(socket.frames.map(frame => frame.text), ['from http']);
  });

  it('routes the connection to the bot the path belongs to', async function() {
    const seen = [];
    chatServer.on('message', () => seen.push('test-ws-bot'));
    restricted.on('message', () => seen.push('other-ws-bot'));

    const socket = await open('/redbot/deepchat/other-ws-bot/ws?chatId=chat-ws-7', {
      origin: 'https://allowed.example.com'
    });
    send(socket, 'hello');
    await new Promise(resolve => setTimeout(resolve, 150));

    assert.deepEqual(seen, ['other-ws-bot']);
  });

  it('refuses the handshake of an origin that is not allowed', async function() {
    let error = null;
    try {
      await open('/redbot/deepchat/other-ws-bot/ws?chatId=chat-ws-8', {
        origin: 'https://evil.example.com'
      });
    } catch (e) {
      error = e;
    }
    assert.isNotNull(error);
    assert.include(error.message, '401');
  });

  it('leaves an unknown path alone, without breaking the endpoints that are mounted', async function() {
    let error = null;
    try {
      await open('/redbot/deepchat/no-such-bot/ws');
    } catch (e) {
      error = e;
    }
    // nothing is mounted there and the socket is not destroyed either: the handshake just times out
    assert.isNotNull(error);
    assert.include(error.message, 'timed out');

    chatServer.on('message', message => reply(message, { type: 'message', content: 'still alive' }));
    const socket = await open('/redbot/deepchat/test-ws-bot/ws?chatId=chat-ws-9');
    send(socket, 'hello');
    await socket.waitFor(1);
    assert.deepEqual(socket.frames.map(frame => frame.text), ['still alive']);
  });

  it('mounts the endpoint under httpNodeRoot, like the http routes', async function() {
    const RED = RedStub();
    RED.httpNode = app;
    RED.settings.get = () => '1880';
    RED.settings.httpNodeRoot = '/nodered/';
    RED.server = server;
    const contextProvider = ContextProviders(RED).getProvider('memory', {});
    contextProvider.start();
    const prefixed = DeepChatServer.createServer({
      botId: 'prefixed-ws-bot',
      connectMode: 'websocket',
      heartbeat: 0,
      contextProvider,
      debug: false,
      RED
    });
    prefixed.on('error', () => {});
    prefixed.on('message', message => prefixed.send({
      ...message,
      payload: { type: 'message', content: 'prefixed', chatId: message.payload.chatId, inbound: false }
    }));
    await prefixed.start();

    // an upgrade request never enters the Express router, so the prefix is applied by the engine
    const socket = await open('/nodered/redbot/deepchat/prefixed-ws-bot/ws?chatId=chat-ws-11');
    send(socket, 'hello');
    await socket.waitFor(1);
    assert.deepEqual(socket.frames.map(frame => frame.text), ['prefixed']);

    let error = null;
    try {
      // ...and the un-prefixed path is not mounted
      await open('/redbot/deepchat/prefixed-ws-bot/ws?chatId=chat-ws-11');
    } catch (e) {
      error = e;
    }
    assert.isNotNull(error);
    await prefixed.stop();
  });

  it('unmounts the endpoint and closes the sockets when the bot stops', async function() {
    const RED = RedStub();
    RED.httpNode = app;
    RED.settings.get = () => '1880';
    RED.server = server;
    const contextProvider = ContextProviders(RED).getProvider('memory', {});
    contextProvider.start();
    const temporary = DeepChatServer.createServer({
      botId: 'temporary-ws-bot',
      connectMode: 'websocket',
      heartbeat: 0,
      contextProvider,
      debug: false,
      RED
    });
    temporary.on('error', () => {});
    await temporary.start();

    const socket = await open('/redbot/deepchat/temporary-ws-bot/ws?chatId=chat-ws-10');
    const closed = new Promise(resolve => socket.on('close', () => resolve(true)));
    await temporary.stop();
    assert.isTrue(await closed);

    let error = null;
    try {
      await open('/redbot/deepchat/temporary-ws-bot/ws?chatId=chat-ws-10');
    } catch (e) {
      error = e;
    }
    assert.isNotNull(error);
  });
});
