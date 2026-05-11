/**
 * isMissionControlEnabled
 * Tells if Mission Control is enabled in this instnce
 * @returns {boolean}
 */

const { REDBOT_ENABLE_MISSION_CONTROL } = require('../../src/env');

module.exports = (RED) => {
  const mcSettings = RED.settings.RedBot || {};
  return () => mcSettings.enableMissionControl || REDBOT_ENABLE_MISSION_CONTROL === 'true';
};
