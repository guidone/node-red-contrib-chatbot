/**
 * hasField
 * @param {object} obj - Hash of flags
 */
const hasField = function(obj) {
  if (obj == null) {
    return true;
  }
  const fields = Array.from(arguments).slice(1); // all except first
  return fields.some(field => obj[field] === undefined || obj[field] === true);
};

export default hasField;
