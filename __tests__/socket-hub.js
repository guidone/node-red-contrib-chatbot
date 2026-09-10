const assert = require('chai').assert;
const EventEmitter = require('events').EventEmitter;

const SocketHub = require('../lib/socket-server');

// minimal stand in for a ws connection: it records what was written to it
const OPEN = 1;
const CLOSED = 3;

const FakeSocket = () => {
  const socket = new EventEmitter();
  socket.sent = [];
  socket.pings = 0;
  socket.closed = null;
  socket.readyState = OPEN;
  socket.send = payload => { socket.sent.push(JSON.parse(payload)); };
  socket.close = (code, reason) => {
    socket.closed = { code, reason };
    socket.readyState = CLOSED;
    socket.emit('close');
  };
  socket.terminate = () => {
    socket.terminated = true;
    socket.readyState = CLOSED;
    socket.emit('close');
  };
  socket.ping = () => {
    socket.pings += 1;
    // a live socket answers every ping, a dead one never does
    if (socket.autoPong) {
      socket.emit('pong');
    }
  };
  return socket;
};

const frame = payload => Buffer.from(JSON.stringify(payload));

describe('SocketHub', function() {

  it('delivers a payload to the socket of the conversation', function() {
    const hub = SocketHub({ heartbeat: 0 });
    const socket = FakeSocket();
    hub.add('chat-1', socket);

    assert.isTrue(hub.send('chat-1', { text: 'hello', role: 'ai' }));
    assert.deepEqual(socket.sent, [{ text: 'hello', role: 'ai' }]);
    hub.destroy();
  });

  it('keeps the conversations apart', function() {
    const hub = SocketHub({ heartbeat: 0 });
    const first = FakeSocket();
    const second = FakeSocket();
    hub.add('chat-1', first);
    hub.add('chat-2', second);

    hub.send('chat-1', { text: 'for the first' });
    hub.send('chat-2', { text: 'for the second' });

    assert.deepEqual(first.sent, [{ text: 'for the first' }]);
    assert.deepEqual(second.sent, [{ text: 'for the second' }]);
    hub.destroy();
  });

  it('buffers what is produced for an offline conversation and flushes it on reconnection', function() {
    const hub = SocketHub({ heartbeat: 0 });

    assert.isFalse(hub.send('chat-1', { text: 'first' }));
    assert.isFalse(hub.send('chat-1', { text: 'second' }));
    assert.equal(hub.pending('chat-1'), 2);
    assert.isFalse(hub.isConnected('chat-1'));

    const socket = FakeSocket();
    hub.add('chat-1', socket);

    assert.deepEqual(socket.sent, [{ text: 'first' }, { text: 'second' }]);
    assert.equal(hub.pending('chat-1'), 0);
    hub.destroy();
  });

  it('buffers again when the conversation goes offline', function() {
    const hub = SocketHub({ heartbeat: 0 });
    const socket = FakeSocket();
    hub.add('chat-1', socket);
    socket.close();

    assert.isFalse(hub.isConnected('chat-1'));
    assert.isFalse(hub.send('chat-1', { text: 'later' }));
    assert.equal(hub.pending('chat-1'), 1);
    hub.destroy();
  });

  it('buffers a payload written while the socket is closing, instead of losing it', function() {
    const hub = SocketHub({ heartbeat: 0 });
    const socket = FakeSocket();
    hub.add('chat-1', socket);
    // the visitor closed the page: the socket is on its way out but the hub hasn't seen "close" yet
    socket.readyState = 2;

    assert.isFalse(hub.send('chat-1', { text: 'in flight' }));
    assert.deepEqual(socket.sent, []);
    assert.equal(hub.pending('chat-1'), 1);

    const reconnected = FakeSocket();
    hub.add('chat-1', reconnected);
    assert.deepEqual(reconnected.sent, [{ text: 'in flight' }]);
    hub.destroy();
  });

  it('drops the oldest message when the buffer of a conversation is full', function() {
    const warnings = [];
    const hub = SocketHub({ heartbeat: 0, bufferLimit: 2, warn: message => warnings.push(message) });

    hub.send('chat-1', { text: 'one' });
    hub.send('chat-1', { text: 'two' });
    hub.send('chat-1', { text: 'three' });

    assert.equal(hub.pending('chat-1'), 2);
    assert.lengthOf(warnings, 1);

    const socket = FakeSocket();
    hub.add('chat-1', socket);
    assert.deepEqual(socket.sent, [{ text: 'two' }, { text: 'three' }]);
    hub.destroy();
  });

  it('replaces the previous socket of the same conversation, last one wins', function() {
    const hub = SocketHub({ heartbeat: 0 });
    const first = FakeSocket();
    const second = FakeSocket();
    hub.add('chat-1', first);
    hub.add('chat-1', second);

    assert.isNotNull(first.closed);
    assert.isTrue(hub.isConnected('chat-1'));
    hub.send('chat-1', { text: 'hello' });

    assert.deepEqual(first.sent, []);
    assert.deepEqual(second.sent, [{ text: 'hello' }]);
    hub.destroy();
  });

  it('forwards an inbound frame with the conversation it belongs to', function() {
    const received = [];
    const hub = SocketHub({ heartbeat: 0, onMessage: (chatId, payload) => received.push({ chatId, payload }) });
    const socket = FakeSocket();
    hub.add('chat-1', socket);

    socket.emit('message', frame({ messages: [{ role: 'user', text: 'hello' }] }));

    assert.lengthOf(received, 1);
    assert.equal(received[0].chatId, 'chat-1');
    assert.equal(received[0].payload.messages[0].text, 'hello');
    hub.destroy();
  });

  it('discards a frame that is not valid JSON', function() {
    const warnings = [];
    const received = [];
    const hub = SocketHub({
      heartbeat: 0,
      onMessage: (chatId, payload) => received.push(payload),
      warn: message => warnings.push(message)
    });
    const socket = FakeSocket();
    hub.add('chat-1', socket);

    socket.emit('message', Buffer.from('not json'));

    assert.lengthOf(received, 0);
    assert.lengthOf(warnings, 1);
    hub.destroy();
  });

  it('notifies when a conversation goes online and offline', function() {
    const events = [];
    const hub = SocketHub({
      heartbeat: 0,
      onOpen: chatId => events.push(`open:${chatId}`),
      onClose: chatId => events.push(`close:${chatId}`)
    });
    const socket = FakeSocket();
    hub.add('chat-1', socket);
    socket.emit('close');

    assert.deepEqual(events, ['open:chat-1', 'close:chat-1']);
    hub.destroy();
  });

  it('pings the connected sockets and terminates the ones that stopped answering', function(done) {
    const hub = SocketHub({ heartbeat: 20 });
    const alive = FakeSocket();
    const dead = FakeSocket();
    alive.autoPong = true;
    hub.add('chat-alive', alive);
    hub.add('chat-dead', dead);

    // enough time for a few ticks: the socket that answers survives all of them, the other one is
    // terminated on the tick that follows its unanswered ping
    setTimeout(() => {
      assert.isAbove(alive.pings, 1);
      assert.isUndefined(alive.terminated);
      assert.isTrue(hub.isConnected('chat-alive'));

      assert.equal(dead.pings, 1);
      assert.isTrue(dead.terminated);
      assert.isFalse(hub.isConnected('chat-dead'));
      hub.destroy();
      done();
    }, 90);
  });

  it('closes every connection on destroy', function() {
    const hub = SocketHub({ heartbeat: 0 });
    const socket = FakeSocket();
    hub.add('chat-1', socket);
    hub.destroy();

    assert.isNotNull(socket.closed);
    assert.isFalse(hub.isConnected('chat-1'));
  });
});
