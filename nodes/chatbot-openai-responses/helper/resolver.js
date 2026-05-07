const _ = require('lodash');

/**
 * getExtractionObject
 * Get a simulated object for context in a way it's possible to use expressions like flow.my_sessions.sessions[2].id
 * It extracts the first key "my_sessions" and returns an object like { my_ sessions: ... }, on this it's used
 * the _.get(..., my_sessions.sessions[2].id)
 * @param {*} context
 * @param {*} path
 * @returns
 */
const getExtractionObject = (context, path) => {
  const firstKey = path.split('.')[0].replace(/\[[0-9]*\]/, '');
  return {
    [firstKey]: context.get(firstKey)
  };
};

const resolver = (path, keyType, { node, msg } = {}, defaultValue) => {
  if (keyType === 'msg') {
    return _.get(msg ?? {}, path) ?? defaultValue;
  } else if (keyType === 'flow') {
    return _.get(getExtractionObject(node.context().flow, path), path) ?? defaultValue;
  } else if (keyType === 'global') {
    return _.get(getExtractionObject(node.context().global, path), path) ?? defaultValue;
  } else if (keyType === 'node') {
    return _.get(getExtractionObject(node.context(), path), path) ?? defaultValue;
  }
  return defaultValue;
};

module.exports = resolver;