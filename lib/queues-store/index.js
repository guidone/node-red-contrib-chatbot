const _ = require('underscore');
const extend = require('extend');
const fs = require('fs');
const uuid   = require('uuid');
const Sequelize = require('sequelize');

const Op  = Sequelize.Op;

const defineQueueTable = (sequelize, name) => {
  return sequelize.define(
    name,
    {
      taskId: Sequelize.TEXT,
      lock: Sequelize.TEXT,
      task: Sequelize.TEXT,
      priority: Sequelize.NUMBER,
    },
    {
      indexes: [
        { name: `${name}_taskId`, using: 'BTREE', fields: ['taskId'] },
        { name: `${name}_lock`, using: 'BTREE', fields: ['lock'] },
        { name: `${name}_priority`, using: 'BTREE', fields: ['priority', 'id'] }
      ]
    }
  );
};

function SqlStore(opts) {
  opts = opts || {};
  this.tableName = opts.tableName;
  this.storage = opts.storage;
  extend(this, opts);

  this.takeFirstN = takeNextN(true, this);
  this.takeLastN = takeNextN(false, this);
}

const takeNextN = function (first, self) {
  return async function (n, cb) {
    try {
      const subquery = await self.Task.findAll({
        attributes: ['id', 'taskId'],
        where: {
          lock: { [Op.eq]: '' }
        },
        order: [
          ['priority', 'DESC'],
          ['id', first ? 'ASC' : 'DESC']
        ],
        limit: n
      });
      const taskIds = subquery.map(row => row.taskId);
      const lockId = uuid.v4();

      await self.Task.update({
        lock: lockId
      }, {
        where: {
          taskId: {
            [Op.in]: taskIds
          }
        }
      });

      cb(null, taskIds.length !== 0 ? lockId : '');
    } catch(e) {
      cb(e);
    }

    /* Original:
    var self = this;
    var subquery = function (fields, n) {
      return self.adapter.knex(self.tableName).select(fields).where('lock', '').orderBy('priority', 'DESC').orderBy('added', first ? 'ASC' : 'DESC').limit(n);
    };
    if (self.dialect == 'mysql') {
      var innerSubquery = subquery;
      subquery = function (fields, n) {
        return self.adapter.knex.select(fields).from(innerSubquery(fields, n).as('tmp'));
      }
    }
    var lockId = uuid.v4();
    self.adapter.knex(self.tableName)
      .where('lock', '').andWhere('id', 'in', subquery(['id'], n))
      .update({ lock: lockId })
      .then(function (numUpdated) {
        var val = numUpdated > 0 ? lockId : '';
        cb(null, val);
        return val;
      }).catch(cb);
    */
  };
};
SqlStore.prototype.connect = async function (cb) {
  const self = this;

  // create connection
  const sequelize = new Sequelize('queue', '', '', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: this.storage,
    logging: false
  });
  const name = _.isEmpty(self.tableName) ? 'task' : `tasks-${self.tableName.replace(/[^a-z0-9]/g,'')}`;

  self.Task = defineQueueTable(sequelize, name);

  // create file if not exists
  if (!fs.existsSync(this.storage)) {
    // create here the default table
    defineQueueTable(sequelize, 'tasks');
    await sequelize.sync({ force: true });
  }

  // create table if not exist
  await self.Task.sync();
  const row = await self.Task.count({
    where: {
      lock: { [Op.eq]: ''}
    }
  });

  cb(null, row || 0);

  /* Original:
  self.adapter.connect(function (err) {
    if (err) return cb(err);
    var sql = util.format("CREATE TABLE IF NOT EXISTS %s ", self.tableName);
    var dialect = self.dialect;
    if (dialect === 'sqlite') {
      sql += "(id TEXT UNIQUE, lock TEXT, task TEXT, priority NUMERIC, added INTEGER PRIMARY KEY AUTOINCREMENT)";
    } else if (dialect === 'postgres') {
      sql += "(id TEXT UNIQUE, lock TEXT, task TEXT, priority NUMERIC, added SERIAL PRIMARY KEY)";
    } else if (dialect === 'mysql') {
      sql += "(id VARCHAR(191) UNIQUE, `lock` TEXT, task TEXT, priority NUMERIC, added INTEGER PRIMARY KEY AUTO_INCREMENT)";
    } else {
      throw new Error("Unhandled dialect: " + dialect);
    }
    return self.adapter.knex.raw(sql).then(function () {
      return self.adapter.knex(self.tableName).count('*').where('lock', '').then(function (rows) {
        var row = rows[0];
        row = row ? row['count'] || row['count(*)'] : 0;
        cb(null, row);
        return row;
      });
    }).catch(cb);
  });*/

};

SqlStore.prototype.getTask = async function (taskId, cb) {
  const self = this;
  try {
    const row = await self.Task.findOne({
      where: {
        taskId, lock: { [Op.eq]: '' }
      }
    });
    // if not found return notiing
    if (row == null) {
      cb();
      return;
    }
    let savedTask;
    try {
      savedTask = JSON.parse(row.task);
    } catch (e) {
      return cb('failed_to_deserialize_task');
    }
    cb(null, savedTask);
  } catch(e) {
    cb(e);
  }

  /*this.adapter.knex(this.tableName).where('id', taskId).andWhere('lock', '').then(function (rows) {
    if (!rows.length) return cb();
    var row = rows[0];
    try {
      var savedTask = JSON.parse(row.task);
    } catch (e) {
      return cb('failed_to_deserialize_task');
    }
    cb(null, savedTask);
    return savedTask;
  }).catch(cb);*/
};

SqlStore.prototype.deleteTask = async function (taskId, cb) {
  const self = this;
  // Original:
  // this.adapter.knex(this.tableName).where('id', taskId).del().then(function () { cb(); return taskId; }).catch(cb);
  try {
    await self.Task.destroy({
      where: { taskId }
    });
  } catch(e) {
    cb(e);
  }
};

SqlStore.prototype.putTask = async function (taskId, task, priority, cb) {
  const self = this;
  try {
    var serializedTask = JSON.stringify(task);
  } catch (e) {
    return cb('failed_to_serialize_task');
  }
  // get task if exists
  const currentTask = await self.Task.findOne({ where: { taskId }});

  if (currentTask != null) {
    self.Task.update(
      { task: serializedTask, priority: priority || 1 },
      { where: { id: currentTask.id }}
    );
  } else {
    await self.Task.create({
      taskId,
      task: serializedTask,
      priority: priority || 1,
      lock: ''
    });
  }
  cb();

  // Original:
  // this.adapter.upsert({ id: taskId, task: serializedTask, priority: priority || 1, lock: '' }, cb);
};

SqlStore.prototype.getLock = async function (lockId, cb) {
  try {
    const rows = await this.Task.findAll({
      attributes: ['id', 'taskId', 'task'],
      where: { lock: lockId }
    });
    const tasks = {};
    rows.forEach(function (row) {
      tasks[row.taskId] = JSON.parse(row.task);
    })
    cb(null, tasks);
  } catch(e) {
    cb(e);
  }
  /* Original:
  this.adapter.knex(this.tableName).select(['id', 'task']).where('lock', lockId).then(function (rows) {
    var tasks = {};
    rows.forEach(function (row) {
      tasks[row.id] = JSON.parse(row.task);
    })
    cb(null, tasks);
    return tasks;
  }).catch(cb);
  */
};

SqlStore.prototype.getRunningTasks = async function (cb) {
  const running = await this.Task.findAll({
    attributes: ['id', 'task', 'taskId', 'lock'],
    where: { lock: { [Op.ne]: '' }}
  });

  const tasks = {};
  running.forEach(row => {
    tasks[row.lock] = tasks[row.lock] || [];
    tasks[row.lock][row.taskId] = JSON.parse(row.task);
  });

  cb(null, tasks);

  /* Original:
  this.adapter.knex(this.tableName).select(['id', 'task', 'lock']).then(function (rows) {
    var tasks = {};
    rows.forEach(function (row) {
      if (!row.lock) return;
      tasks[row.lock] = tasks[row.lock] || [];
      tasks[row.lock][row.id] = JSON.parse(row.task);
    })
    cb(null, tasks);
    return tasks;
  }).catch(cb);*/
};

SqlStore.prototype.releaseLock = async function (lockId, cb) {
  const self = this;
  // Original:
  // this.adapter.knex(this.tableName).where('lock', lockId).del().then(function () { cb(); return lockId; }).catch(cb);
  try {

    if (lockId !== '') {
      await self.Task.destroy({
        where: { lock: lockId }
      });
    }
    cb();
  } catch(e) {
    cb(e);
  }
};

SqlStore.prototype.close = function (cb) {
  cb();
};

module.exports = SqlStore;