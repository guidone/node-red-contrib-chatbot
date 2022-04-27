module.exports = (RED) => {
  return (nodeId) => {
    // try find the node instance in the usual way
    const node = RED.nodes.getNode(nodeId);
    if (node != null) {
      return node;
    } else {
      // search for alias id of nodes used in subflow.
      // this is an undocumented feature, all subflow contains a _flow which contains all nodes
      // instances of the subflow (activeNodes)
      // only search in the first level for performance reason
      let found;
      RED.nodes.eachNode(n => {
        if (found == null) {
          const node = RED.nodes.getNode(n.id);
          if (node != null && node._flow != null && node._flow[nodeId]) {
            found = node._flow[nodeId];
          }
        }
      });
      return found;
    }
  };
};
