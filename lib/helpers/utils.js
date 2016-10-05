
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
  }


};
