const _ = require('lodash');

const hasOneOf = (obj, keys = []) => {
  return keys.some(key => !_.isEmpty(obj[key]));
};

module.exports = hasOneOf;