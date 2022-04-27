import _ from 'lodash';

// get the index of the array
export default (path = [], currentPath) => {
  let result = [];
  if (_.isEmpty(path)) {
    return null;
  }
  path.forEach(path => {
    if (path.startsWith(currentPath + '[')) {
      const temp = path.replace(currentPath + '[', '');
      const index = temp.substring(0,temp.indexOf(']'));
      if (!isNaN(parseInt(index, 10))) {
        result.push(parseInt(index, 10));
      };
    }
  })
  return !_.isEmpty(result) ? result : null;
};