const _ = require('lodash');

const DEFAULT_HEARTBEAT = 30000;
const DEFAULT_BUFFER_LIMIT = 100;

// WebSocket.OPEN, the only state a payload can be written in
const OPEN = 1;

// close codes, https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
const CLOSE_REPLACED = 4000;
const CLOSE_POLICY = 1008;

/**
 * SocketHub
 * The connection registry of a WebSocket based platform: it maps the conversation (`chatId`) to the
 * socket the visitor is currently connected with, so that the `.out()` middlewares of the platform can
 * address a conversation exactly like they would address a platform API.
 *
 * Unlike a webhook platform the address of a conversation is a live socket, so it can be missing:
 * anything produced while nobody is connected (a *Push Message* node, or a flow answering after the
 * visitor closed the page) is buffered per conversation and flushed on reconnection.
 *
 * @param {object} options
 * @param {number} [options.heartbeat=30000] interval (ms) of the ping/pong keep alive, `0` disables it.
 *   Reverse proxies drop idle upgraded connections, the heartbeat keeps them open and detects the
 *   sockets that died without a close frame
 * @param {number} [options.bufferLimit=100] max messages buffered for a disconnected conversation
 * @param {function} [options.onMessage] `(chatId, frame, connection)` an inbound frame, already parsed
 * @param {function} [options.onOpen] `(chatId, connection)` a conversation went online
 * @param {function} [options.onClose] `(chatId, connection)` a conversation went offline
 * @param {function} [options.onError] `(error)` transport error, not fatal
 * @param {function} [options.warn] `(message)` non fatal warning
 */
module.exports = function SocketHub(options = {}) {
  const heartbeat = options.heartbeat != null ? options.heartbeat : DEFAULT_HEARTBEAT;
  const bufferLimit = options.bufferLimit != null ? options.bufferLimit : DEFAULT_BUFFER_LIMIT;
  const onMessage = _.isFunction(options.onMessage) ? options.onMessage : () => {};
  const onOpen = _.isFunction(options.onOpen) ? options.onOpen : () => {};
  const onClose = _.isFunction(options.onClose) ? options.onClose : () => {};
  const onError = _.isFunction(options.onError) ? options.onError : () => {};
  const warn = _.isFunction(options.warn) ? options.warn : () => {};

  // chatId -> connection, at most one: the last connection wins
  let connections = {};
  // chatId -> [payload] produced while the conversation was offline
  let buffered = {};
  let heartbeatId = null;

  const write = (connection, payload) => {
    // a socket that is closing still accepts send() and silently drops the payload: anything written
    // while it's going away has to be buffered instead, or it would be lost
    if (connection.readyState !== OPEN) {
      return false;
    }
    try {
      connection.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      onError(error);
      return false;
    }
  };

  const startHeartbeat = () => {
    if (heartbeat <= 0 || heartbeatId != null) {
      return;
    }
    heartbeatId = setInterval(() => {
      _.each(connections, connection => {
        if (connection.redbotIsAlive === false) {
          // no pong since the previous tick: the socket is gone, the "close" handler will clean up
          connection.terminate();
          return;
        }
        connection.redbotIsAlive = false;
        try {
          connection.ping();
        } catch (error) {
          onError(error);
        }
      });
    }, heartbeat);
    // don't hold the process up just for the keep alive
    if (_.isFunction(heartbeatId.unref)) {
      heartbeatId.unref();
    }
  };

  const hub = {
    /**
     * @method add
     * Bind a socket to a conversation and flush whatever was produced while it was offline. A second
     * connection for the same conversation (another tab, or a reconnection the old socket didn't
     * notice) replaces the previous one, which is closed
     * @param {string} chatId
     * @param {object} connection the WebSocket
     */
    add(chatId, connection) {
      const previous = connections[chatId];
      // claim the conversation before closing the socket it replaces, so that the "close" of the old one
      // doesn't evict the connection that just took its place
      connections[chatId] = connection;
      if (previous != null && previous !== connection) {
        try {
          previous.close(CLOSE_REPLACED, 'Replaced by a new connection');
        } catch (error) {
          onError(error);
        }
      }
      connection.redbotIsAlive = true;
      connection.on('pong', () => { connection.redbotIsAlive = true; });
      connection.on('error', error => onError(error));
      connection.on('message', data => {
        let frame;
        try {
          frame = JSON.parse(String(data));
        } catch (error) {
          warn(`Discarded a malformed frame from "${chatId}", not valid JSON`);
          return;
        }
        onMessage(chatId, frame, connection);
      });
      connection.on('close', () => {
        // a replaced socket must not evict the connection that took its place
        if (connections[chatId] === connection) {
          delete connections[chatId];
          onClose(chatId, connection);
        }
      });
      startHeartbeat();
      onOpen(chatId, connection);
      // deliver what the flow produced while nobody was listening
      const leftovers = buffered[chatId];
      if (!_.isEmpty(leftovers)) {
        delete buffered[chatId];
        leftovers.forEach(payload => write(connection, payload));
      }
    },

    /**
     * @method send
     * Deliver a payload to a conversation, buffer it until reconnection when it's offline
     * @param {string} chatId
     * @param {object} payload
     * @return {boolean} true when it went out on a live socket
     */
    send(chatId, payload) {
      const connection = connections[chatId];
      if (connection != null && write(connection, payload)) {
        return true;
      }
      const queue = buffered[chatId] || [];
      if (queue.length >= bufferLimit) {
        // the alternative is growing without bounds for a conversation that may never come back
        queue.shift();
        warn(`More than ${bufferLimit} messages buffered for the offline conversation "${chatId}", ` +
          'the oldest one was dropped');
      }
      buffered[chatId] = [...queue, payload];
      return false;
    },

    /**
     * @method reject
     * Refuse a connection that completed the handshake but is not allowed to talk
     * @param {object} connection
     * @param {string} reason
     */
    reject(connection, reason) {
      try {
        connection.close(CLOSE_POLICY, reason);
      } catch (error) {
        onError(error);
      }
    },

    isConnected(chatId) {
      return connections[chatId] != null;
    },

    /**
     * @method pending
     * How many messages are waiting for a conversation to come back
     * @param {string} chatId
     * @return {number}
     */
    pending(chatId) {
      return (buffered[chatId] || []).length;
    },

    /**
     * @method destroy
     * Close every connection and drop the buffers
     */
    destroy() {
      if (heartbeatId != null) {
        clearInterval(heartbeatId);
        heartbeatId = null;
      }
      _.each(connections, connection => {
        try {
          connection.close(1001, 'Chatbot is shutting down');
        } catch (error) {
          // the socket is already gone, nothing to do
        }
      });
      connections = {};
      buffered = {};
    }
  };

  return hub;
};
