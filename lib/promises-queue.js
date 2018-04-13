var _ = require('underscore');

var FileQueue = function() {
  var tasks = [];
  function removeTask(promise) {
    tasks = _(tasks).reject(function(task) {
      return task === promise;
    });
  }

  return {

    count: function() {
      return tasks.length;
    },

    add: function(task) {
      var current = null;
      if (tasks.length === 0) {
        // if it's just one task then launch it
        current = new Promise(task);
      } else {
        // only chain when all the current promises are fulfilled, it's ok since tasks is immutable
        // even if some other task is chained after this
        current = Promise.all(tasks)
          .then(function() {
            return new Promise(task);
          });
      }
      // create new task list with the new one, it's important to create a new instance
      tasks = tasks.concat(current);
      // return the promise, when is done remove from the current task
      return current
        .then(function() {
          removeTask(current);
        });
    }
  };
};

module.exports = FileQueue;
