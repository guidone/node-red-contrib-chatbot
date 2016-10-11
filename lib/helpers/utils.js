var _ = require('underscore');

module.exports = {

  /**
   * @method hasValidPayload
   * Check if the message has a valid payload for a sender
   * @return {String}
   */
  hasValidPayload: function(msg) {

    if (msg.payload == null) {
      return 'msg.payload is empty. The node connected to sender is passing an empty payload.';
    }
    if (msg.payload.chatId == null) {
      return 'msg.payload.chatId is empty. Ensure that a RedBot node is connected to the sender node, if the payload'
        + ' is the result of an elaboration from other nodes, connect it to a message node (text, image, etc.)';
    }
    if (msg.payload.type == null) {
      return 'msg.payload.type is empty. Unsupported message type.';
    }
    return null;
  },

  getChatId: function(msg) {
    if (_.isObject(msg.payload) && msg.payload.chatId != null) {
      return msg.payload.chatId;
    } else if (msg.originalMessage != null) {
      return msg.originalMessage.chat.id;
    } else {
      return null;
    }
  },

  getMessageId: function(msg) {
    if (_.isObject(msg.payload) && msg.payload.messageId != null) {
      return msg.payload.messageId;
    } else if (msg.originalMessage != null) {
      return msg.originalMessage.message_id;
    } else {
      return null;
    }
  },

  /**
   * @method matchContext
   * Test if topics match (intersection of arrays)
   * @param {String/Array} contexts
   * @param {String/Array} rules
   * @return {Boolean}
   */
  matchContext: function(contexts, rules) {
    contexts = contexts || [];
    rules = rules || [];
    if (rules === '*') {
      return true;
    }
    var arrayRules = _.isArray(rules) ? rules : rules.split(',');
    var arrayContexts = _.isArray(contexts) ? contexts : contexts.split(',');
    return _.intersection(arrayContexts, arrayRules).length !== 0;
  }

};
