const _ = require('lodash');
const Sequelize = require('sequelize');

const translateMatrix = {
  gt: Sequelize.Op.gt,
  gte: Sequelize.Op.gte,
  in: Sequelize.Op.in,
  lt: Sequelize.Op.lt,
  lte: Sequelize.Op.lte,
  or: Sequelize.Op.or,
  and: Sequelize.Op.and,
  eq: Sequelize.Op.eq
};
const whereKeys = Object.keys(translateMatrix);

const translateWhere = where => {
  if (where == null) {
    return null;
  }
  if (!_.isObject(where) && !_.isArray(where)) {
    return where;
  }

  if (_.isArray(where)) {
    return where.map(item => translateWhere(item));
  } else if (_.isObject(where)) {
    const cloned = {};
    Object.keys(where).forEach(key => {
      if (whereKeys.includes(key)) {
        cloned[translateMatrix[key]] = translateWhere(where[key]);
        delete cloned[key];
      } else {
        // recursively keep going translating
        cloned[key] = translateWhere(where[key]);
      }
    });
    return cloned;
  }
};

module.exports = translateWhere;