/* eslint-disable no-console */
const _ = require('lodash');

const lcd = require('../lcd/index');

const ENVIRONMENTS = ['production', 'development'];

module.exports = RED => {

  return () => {
    // first of all check ENV variables, wins over everything
    if (!_.isEmpty(process.env.REDBOT_ENVIRONMENT) && ENVIRONMENTS.includes(process.env.REDBOT_ENVIRONMENT)) {
      return process.env.REDBOT_ENVIRONMENT;
    } else {
      let environment;
      const settings = RED.settings || {};
      const globalSettings = settings.functionGlobalContext || {};

      if (!_.isEmpty(settings.RedBot)
        && !_.isEmpty(settings.RedBot.environment)
        && ENVIRONMENTS.includes(settings.RedBot.environment)) {
          environment = settings.RedBot.environment;
      } else if (!_.isEmpty(globalSettings.environment) && ENVIRONMENTS.includes(globalSettings.environment)) {
        // support old way to set environment, but warn against it
        console.log(lcd.timestamp() + 'Setting RedBot environment with "globalSettings" is deprecated.');
        console.log(lcd.timestamp() + '  ' + lcd.grey('Set the "environment" variable in Node-RED settings.js:'));
        console.log(lcd.timestamp() + '  ' + lcd.grey('  // ...'));
        console.log(lcd.timestamp() + '  ' + lcd.grey('  RedBot: {'));
        console.log(lcd.timestamp() + '  ' + lcd.grey('    environment: \'production\''));
        console.log(lcd.timestamp() + '  ' + lcd.grey('  }'));
        console.log(lcd.timestamp() + '  ' + lcd.grey('  // ...'));
        environment = globalSettings.environment;
      }

      return environment != null ? environment : 'development';
    }
  };
};