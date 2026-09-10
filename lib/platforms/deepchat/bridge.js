const _ = require('lodash');

const DEFAULT_TIMEOUT = 20000;
const DEFAULT_COLLECT_WINDOW = 400;

/**
 * ResponseBridge
 * Deep Chat is a request/response widget while RedBot is an asynchronous, multi-message chat engine:
 * a single inbound message can produce zero, one or many outbound messages, at any time.
 * The bridge holds the HTTP response open until the flow stops producing messages (or the timeout
 * expires) and buffers anything produced while no request is in flight (i.e. Push Message node), so
 * that it's delivered with the next round trip.
 *
 * @param {object} options
 * @param {number} [options.timeout=20000] max time (ms) an inbound request is held open
 * @param {number} [options.collectWindow=400] time (ms) to wait for further messages after the last one
 */
module.exports = function ResponseBridge(options = {}) {
  const timeout = options.timeout != null ? options.timeout : DEFAULT_TIMEOUT;
  const collectWindow = options.collectWindow != null ? options.collectWindow : DEFAULT_COLLECT_WINDOW;

  // chatId -> { responses, resolve, timeoutId, collectId }
  let pending = {};
  // chatId -> [response] produced while no request was in flight
  let buffered = {};

  const close = chatId => {
    const entry = pending[chatId];
    if (entry == null) {
      return;
    }
    delete pending[chatId];
    clearTimeout(entry.timeoutId);
    clearTimeout(entry.collectId);
    entry.resolve(entry.responses);
  };

  return {
    /**
     * @method open
     * Open a collecting window for a chat, resolves with the list of Deep Chat responses produced by the flow
     * @param {string} chatId
     * @return {Promise<Array>}
     */
    open(chatId) {
      // a request for the same chat is still open (the user sent two messages in a row): flush it now
      close(chatId);
      return new Promise(resolve => {
        const entry = {
          responses: !_.isEmpty(buffered[chatId]) ? buffered[chatId] : [],
          resolve,
          timeoutId: null,
          collectId: null
        };
        delete buffered[chatId];
        // leftovers alone don't close the window: the answer to the current message is still to come
        entry.timeoutId = setTimeout(() => close(chatId), timeout);
        pending[chatId] = entry;
      });
    },

    /**
     * @method push
     * Add a Deep Chat response for a chat, buffers it if no request is in flight
     * @param {string} chatId
     * @param {object} response
     * @return {boolean} true if delivered to an open request
     */
    push(chatId, response) {
      const entry = pending[chatId];
      if (entry == null) {
        buffered[chatId] = [...(buffered[chatId] || []), response];
        return false;
      }
      entry.responses.push(response);
      clearTimeout(entry.collectId);
      entry.collectId = setTimeout(() => close(chatId), collectWindow);
      return true;
    },

    isPending(chatId) {
      return pending[chatId] != null;
    },

    /**
     * @method destroy
     * Resolve every open request and drop all buffers
     */
    destroy() {
      _.keys(pending).forEach(close);
      pending = {};
      buffered = {};
    }
  };
};
