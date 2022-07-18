import _ from 'lodash';

const cleanupObject = (value, excludeKeys) => {
  if (_.isArray(value)) {
    // in array of objects generally the id is needed for sync
    return value.map(item => cleanupObject(item, excludeKeys.filter(key => key !== 'id')))
  } else if (_.isObject(value)) {
    const result = {};
    Object.entries(value)
      .filter(([key, value]) => !excludeKeys.includes(key))
      .forEach(([key, value]) => {
        result[key] = cleanupObject(value, excludeKeys);   
      });
    return result;
  } else {
    return value;
  }
};

// remove unwanted params that cast error on graphql (keys not included in the schema)
const cleanupParams = (props, excludeKeys) => {
  if (props.variables != null) {
    const filteredVariables = {};
    Object.entries(props.variables)
      .forEach(([key, value]) => filteredVariables[key] = cleanupObject(value, excludeKeys));
    return { ...props, variables: filteredVariables };
  }
  return props;
};

export default (func, excludeKeys = ['id', 'updatedAt', 'createdAt', '__typename', 'cid']) => {
  return props => func(cleanupParams(props, excludeKeys));
};