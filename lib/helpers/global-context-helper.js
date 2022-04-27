const _ = require('underscore');

let isInitialised = false;
let contextStore = {};

// adopted from: https://github.com/Steveorevo/node-red-contrib-actionflows/pull/20
module.exports = function (RED) {
  return {
    /**
     * Initialise the runtime global context functions and prepare access to global context via `contextStore`.
     * If a context store is not provided, an internal store will be created instead to keep things running.
     * @param {Object} [store] (optional) pass in the context store. Send `null` to use internal memory.
     */
    init(store) {
      if (!isInitialised) {
        if (store) {
          contextStore = store;
        } else {
          contextStore = {
            get(name) {
              return RED.util.getObjectProperty(contextStore, name);
            },
            set(name, value) {
              RED.util.setObjectProperty(contextStore, name, value, true);
            },
          };
        }
        isInitialised = true;
      }
    },
    getContext() {
      return contextStore;
    },
    get(name) {
      return isInitialised ? contextStore.get(name) : null;
    },
    set(name, value) {
      if (isInitialised) {
        contextStore.set(name, value);
      }
    },
    keys() {
      if (contextStore != null) {
        if (_.isFunction(contextStore.keys)) {
          return contextStore.keys();
        }
        return Object.keys(contextStore);
      }
      return [];
    }
  };
};
