const _ = require('underscore');
const Queue = require('better-queue');

const RegisterType = require('../lib/node-installer');
const SQLiteStore = require('../lib/queues-store/index');
const Evaluate = require('../lib/evaluate');
const validators = require('../lib/helpers/validators');

module.exports = function(RED) {
  const registerType = RegisterType(RED);
  const { getMissionControlConfiguration } = require('./mc')(RED);

  function QueueNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    this.mode = config.mode;
    this.initialState = config.initialState;
    this.name = config.name;
    this.delay = config.delay;
    this.running = node.initialState === 'running';
    this.statusMessage = 'Total: 0';

    const { dbQueuePath } = getMissionControlConfiguration();

    this.updateStatus = function() {
      node.status({
        fill: node.running ? 'green' : 'red',
        shape: 'dot',
        text: node.statusMessage
      });
    }

    this.queue = new Queue(
      function (input, cb) {

        const stats = node.queue.getStats();
        node.statusMessage = `Total: ${stats.total}`;
        node.updateStatus();

        // stop if in single mode
        if (node.mode === 'single') {
          node.queue.pause();
          node.running = false;
          node.updateStatus();
          cb(null, input);
        } else if (!_.isEmpty(node.delay)) {
          // try to parse the delay
          let evaluatedDelay = 0;
          if (!isNaN(parseInt(node.delay, 10))) {
            // simple string as integer
            evaluatedDelay = parseInt(node.delay, 10);
          } else if (_.isString(node.delay) && validators.isVariable(node.delay.trim())) {
            // evaluate vairables from flow and global context
            const evaluate = Evaluate({}, node);
            const tmp = evaluate(node.delay.trim());
            evaluatedDelay = !isNaN(parseInt(tmp, 10)) ? parseInt(tmp, 10) : 0;
          }

          node.queue.pause();
          setTimeout(() => {
            node.queue.resume();
          }, evaluatedDelay);
        }

        cb(null, input);
      },
      {
        store: new SQLiteStore({
          storage: dbQueuePath,
          tableName: node.name
        }),
        id: 'taskId',
        merge: function (oldTask, newTask, cb) {
          cb(null, { ...oldTask, ...newTask });
        },
        //afterProcessDelay: delay,
        //batchDelay: delay,
        batchSize: 1, // always one
        autoResume: node.initialState === 'running'
      }
    ).on('task_finish', function(taskId, result) {
      node.send({ payload: result });
    });
    this.updateStatus();

    this.on('input', function(msg, send, done) {
      // send/done compatibility for node-red < 1.0
      send = send || function() { node.send.apply(node, arguments) };
      done = done || function(error) { node.error.call(node, error, msg) };

      if (msg.start != null || msg.next != null) {
        node.running = true;
        node.updateStatus();
        node.queue.resume();
        done();
      } else if (msg.pause != null) {
        node.running = false;
        node.updateStatus();
        node.queue.pause();
        done();
      } else {
        // feed the queue
        (Array.isArray(msg.payload) ? msg.payload : [msg.payload])
          .forEach(item => {
            node.queue.push(item);
            // putting an element on the queue, restarts it
            if (!node.running) {
              node.queue.pause();
            }
          });
      }

      done();
    });
  }

  registerType('mc-queue', QueueNode);
};
