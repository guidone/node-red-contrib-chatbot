const _ = require('underscore');
const extend = require('extend');
var uuid   = require('uuid');
var util   = require('util');

const Sequelize = require('sequelize');
const Op  = Sequelize.Op;





function SqlStore(opts) {
  console.log('initializing sqlite store')
  opts = opts || {};
  opts.tableName = opts.tableName || 'tasks';
  extend(this, opts);
  const store = this;



  /*var dialect = opts.dialect || 'sqlite';
  if (dialect === 'sqlite') {
    var Adapter = require('./sqlite');
    this.adapter = new Adapter(opts);
  } else if (dialect === 'postgres') {
    var Adapter = require('./postgres');
    this.adapter = new Adapter(opts);
  } else if (dialect === 'mysql') {
    var Adapter = require('./mysql');
    this.adapter = new Adapter(opts);
  } else {
    throw new Error("Unhandled dialect: " + dialect);
  }
  this.dialect = dialect;
  */

  this.takeFirstN = takeNextN(true, this);
  this.takeLastN = takeNextN(false, this);

  this.dialect = 'sqlite';
}

// http://stackoverflow.com/questions/11532550/atomic-update-select-in-postgres
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

      console.log('taskIds', taskIds)

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
      console.log('error gettask', e)
      cb(e);
    }


    /*var self = this;
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

  // TODO set database file name
  const sequelize = new Sequelize('queue', '', '', {
    host: 'localhost',
    dialect: 'sqlite',
    storage: '/Users/guidone/web/my-queue.sqlite',
    logging: false
  });
  const name = _.isEmpty(self.tableName) ? 'task' : `tasks-${self.tableName.replace(/[^a-z0-9]/g,'')}`;

  self.Task = sequelize.define(
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

  // create table if not exist
  await self.Task.sync();
  // TODO init if table doesn't exist

  self.Task2 = self.Task;

  const row = await self.Task.count({
    where: {
      lock: { [Op.eq]: ''}
    }
  });
  console.log('counting', row)

  cb(null, row || 0);

  /*self.adapter.connect(function (err) {
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
  //this.adapter.knex(this.tableName).where('id', taskId).del().then(function () { cb(); return taskId; }).catch(cb);
  console.log('deleteTask')
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

  // TODO upsert
  const newTask = await self.Task.create({
    taskId,
    task: serializedTask,
    priority: priority || 1,
    lock: ''
  });

  console.log('created task', newTask.id)

  cb();


  //this.adapter.upsert({ id: taskId, task: serializedTask, priority: priority || 1, lock: '' }, cb);
};

//SqlStore.prototype.takeFirstN = takeNextN(true);
//SqlStore.prototype.takeLastN = takeNextN(false);

SqlStore.prototype.getLock = async function (lockId, cb) {
  const self = this;
  console.log('chi sono', this, this.Task.findAll)
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
  /*this.adapter.knex(this.tableName).select(['id', 'task']).where('lock', lockId).then(function (rows) {
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
  const self = this;
  console.log('----- get running tasks', this)
  const running = await this.Task.findAll({
    attributes: ['id', 'task', 'taskId', 'lock'],
    where: { lock: { [Op.ne]: '' }}
  });


  const tasks = {};
  running.forEach(row => {
    tasks[row.lock] = tasks[row.lock] || [];
    tasks[row.lock][row.taskId] = JSON.parse(row.task);
  });

  console.log('tasks', tasks);
  cb(null, tasks);

  // TODO catch error

  /*this.adapter.knex(this.tableName).select(['id', 'task', 'lock']).then(function (rows) {
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
  //this.adapter.knex(this.tableName).where('lock', lockId).del().then(function () { cb(); return lockId; }).catch(cb);
  try {

    if (lockId !== '') {
      console.log('deleting...')
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
  //if (this.adapter) return this.adapter.close(cb);
  cb();
};

module.exports = SqlStore;