/* eslint-disable no-console */
const Sequelize = require('sequelize');
const fs = require('fs');

const lcd = require('../lcd');
const { tableExists, isEmptyDatabase } = require('./database');

const getMigrations = (migrationsDir) => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readdirSync(migrationsDir)
    .map(migration => parseInt(migration.replace('.sql', ''), 10))
    .filter(migration => !isNaN(migration))
    .sort((a, b) => a < b ? -1 : 1);
};

module.exports = {
  getMigrations,
  migrate: async (sequelize, migrationsDir) => {
    let createdVersionsTable = false;
    let rowCurrentVersion;
    // define database version, create if not exists
    const Version = sequelize.define('version', {
      version: Sequelize.INTEGER
    });
    // checks
    if (await isEmptyDatabase(sequelize)) {
      // if table is empty, then is going to be initialized, no need to apply migrations
      // they will fail, it will brand new
      console.log(lcd.timestamp() + 'Database is empty, skipping migrations');
      return;
    } else if (!(await tableExists('versions', sequelize))) {
      // if versions table is not present, then create and initialize to 0
      // means it's an old database, it will receive all migrations
      await Version.sync({ force: true });
      createdVersionsTable = true;
      rowCurrentVersion = await Version.create({ version: 0 });
    } else {
      // if version is present, then get the latest version, if empty then init to zero
      rowCurrentVersion = await Version.findOne();
      if (rowCurrentVersion == null) {
        rowCurrentVersion = await Version.create({ version: 0 });
      }
    }
    // get all migrations, cleanup and sort by most recent
    const migrations = getMigrations(migrationsDir);

    console.log(lcd.timestamp() + 'Executing Queue DB migrations');
    if (createdVersionsTable) {
      console.log(lcd.timestamp() + '  ' + lcd.grey('Initialized "versions" table'));
    }
    console.log(lcd.timestamp() + '  ' + lcd.grey(`Searching migrations in ${migrationsDir}}`));
    console.log(lcd.timestamp() + '  ' + lcd.grey(`Found ${migrations.length} migrations`));
    console.log(lcd.timestamp() + '  ' + lcd.grey(`Current DB version: ${rowCurrentVersion != null ? rowCurrentVersion.version : 1}`));
    // only install migrations with version > current version
    let executedMigrations = 0;
    for(let idx = 0; idx < migrations.length; idx++) {
      if (migrations[idx] > rowCurrentVersion.version) {
        console.log(lcd.timestamp() + '  ' + lcd.grey('Executing migration to version: ') + lcd.green(migrations[idx]));
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        const query = fs.readFileSync(`${migrationsDir}/${migrations[idx]}.sql`, 'UTF8');
        try {
          const queries = query.split('\n');
          for (let i = 0; i < queries.length; i++) {
            console.log(lcd.timestamp() + '    ' + lcd.green(' - ') + lcd.grey(queries[i]));
            await sequelize.query(queries[i]);
          }
          // update current version
          rowCurrentVersion.version = migrations[idx];
          await rowCurrentVersion.save();
          executedMigrations++;
        } catch(e) {
          console.log(lcd.timestamp() + '    ' + lcd.orange(`Error executing migration #${migrations[idx]}: ${query}`));
          console.log(e);
        }
      }
    }
    if (executedMigrations !== 0) {
      console.log(lcd.timestamp() + '  ' + lcd.grey('Migration completed (') + lcd.green(executedMigrations) + lcd.grey(')'));
    } else {
      console.log(lcd.timestamp() + '  ' + lcd.grey('No migrations applied. Done.'));
    }
  }
};