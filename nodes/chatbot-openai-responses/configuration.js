module.exports = function(RED) {
  function RemoteServerNode(n) {
      RED.nodes.createNode(this,n);
      this.name = n.name;
  }
  RED.nodes.registerType(
    'chatbot-open-ai-key',
    RemoteServerNode,
    {
      credentials: {
        apiKey: { type: 'password' }
      }
    }
  );
}