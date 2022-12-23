const tableExists = async (name, sequelize) => {
  try {
    await sequelize.query(`SELECT * FROM ${name}`);
    return true;
  } catch(e) {
    return false;
  }
};

const isEmptyDatabase = async (sequelize) => {
  return !(await tableExists('admins', sequelize));
};

module.exports = { tableExists, isEmptyDatabase };
