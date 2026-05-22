const path = require('path');
const os = require('os');

const globalSettings = require(path.join(os.homedir(), '.node-red', 'settings.js'));

module.exports = {
  ...globalSettings,
  nodesDir: [
    ...(globalSettings.nodesDir ? [].concat(globalSettings.nodesDir) : []),
    __dirname
  ]
};
