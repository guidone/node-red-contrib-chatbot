module.exports = (RED) => {
  const searchSubflow = (subflows, path) => {
    let result;
    Object.keys(subflows).forEach((key) => {
      if (subflows[key].path === path) {
        result = subflows[key];
      }
    });
    return result;
  };

  const searchByAlias = (nodes, id) => {
    let result;
    Object.keys(nodes).forEach((key) => {
      if (nodes[key]._alias === id) {
        result = nodes[key];
      }
    });
    return result;
  };

  const findNodeByPath = (nodePath, scope = null, idx = 0) => {
    if (typeof nodePath !== 'string') {
      return undefined;
    }
    const ids = nodePath.split('/');
    if (idx < ids.length - 1) {
      if (idx === 0) {
        return findNodeByPath(nodePath, null, 1);
      } else {
        const tryNode = RED.nodes.getNode(ids[idx]);
        if (tryNode != null) {
          return findNodeByPath(nodePath, tryNode, idx + 1);
        } else if (
          scope._flow != null &&
          searchSubflow(
            scope._flow.subflowInstanceNodes,
            ids.slice(0, idx + 1).join('/')
          )
        ) {
          return findNodeByPath(
            nodePath,
            searchSubflow(
              scope._flow.subflowInstanceNodes,
              ids.slice(0, idx + 1).join('/')
            ),
            idx + 1
          );
        } else if (
          scope.subflowInstanceNodes != null &&
          searchSubflow(
            scope.subflowInstanceNodes,
            ids.slice(0, idx + 1).join('/')
          )
        ) {
          return findNodeByPath(
            nodePath,
            searchSubflow(
              scope.subflowInstanceNodes,
              ids.slice(0, idx + 1).join('/')
            ),
            idx + 1
          );
        }
        return undefined;
      }
    } else {
      if (RED.nodes.getNode(ids[idx])) {
        return RED.nodes.getNode(ids[idx]);
      } else if (scope && scope.activeNodes) {
        return searchByAlias(scope.activeNodes, ids[idx]);
      } else if (scope && scope._flow != null) {
        return searchByAlias(scope._flow.activeNodes, ids[idx]);
      }
      return undefined;
    }
  };

  return findNodeByPath;
};
