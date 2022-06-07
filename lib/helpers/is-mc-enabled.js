/**
 * isMissionControlEnabled
 * Tells if Mission Control is enabled in this instnce
 * @returns {boolean}
 */

module.exports = (RED) => {
  const mcSettings = RED.settings.RedBot || {};
  return () => mcSettings.enableMissionControl || process.env.REDBOT_ENABLE_MISSION_CONTROL === 'true';
};
