/**
 * mergeNotEmpty(obj1, ..., objN)
 * Merge objects but not considering empty objects
 *
 * mergeNotEmpty({ id: '', test: 42 }, { id: '42' }) -> { id: '42', test: 42 }
 */

const isEmpty = value => value === null || value === undefined || value === '';

const mergeNotEmpty = function() {
  let result = {};
  const params = Array.from(arguments);

  params.forEach(obj => {
    const keys = Object.keys(obj);
    keys.forEach(key => {
      if (!isEmpty(obj[key])) {
        result[key] = obj[key];
      }
    });
  });

  return result;
};

module.exports = mergeNotEmpty;
