const Queue = require('better-queue');

const RegisterType = require('../lib/node-installer');
const SQLiteStore = require('../lib/queues-store/index');

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

    this.updateStatus = function() {
      node.status({
        fill: node.running ? 'green' : 'red',
        shape: 'dot',
        text: node.statusMessage
      });
    }

    const { dbQueuePath } = getMissionControlConfiguration();

    const delay = !isNaN(parseInt(node.delay, 10)) ? parseInt(node.delay, 10) : 0
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
        }

        cb(null, input);
      },
      {
        store: new SQLiteStore({
          storage: dbQueuePath,
          tableName: node.name
        }),
        afterProcessDelay: delay,
        batchDelay: delay,
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