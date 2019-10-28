const fs = require('fs');
const lcd = require('./helpers/lcd');

module.exports = function(RED) {
  let config = {
    name: 'RedBot',
    hideNodes: []
  };
  // load general config
  let content;
  try {
    content = fs.readFileSync(`${__dirname}/../redbot.config.html`, 'utf-8');
  } catch(e) {
    // eslint-disable-next-line no-console
    console.log(lcd.error(`Unable to find config file: ${__dirname}/../redbot.config.html`));
  }
  // if file exists
  if (content != null) {
    // extract config
    const parseConfig = content.match(/\$\.RedBot\.config[\s]{1,}=[\s]{1,}\{([\n\r\t\s\S]*)\}/m);
    if (parseConfig == null) {
      lcd.title('Invalid file: redbot.config.html');
      // eslint-disable-next-line no-console
      console.log(lcd.warn(content));
    } else {
      // try to parse
      const json = `{${parseConfig[1]}}`;
      try {
        config = JSON.parse(json);
      } catch (e) {
        lcd.title('Error parsing JSON file: redbot.config.html');
        // eslint-disable-next-line no-console
        console.log(lcd.warn(json));
        // eslint-disable-next-line no-console
        console.log(lcd.green('Pay attention to write a valid json inside $.RedBot.config, for example:'));
        // eslint-disable-next-line no-console
        console.log(lcd.green('$.RedBot.config = {'));
        // eslint-disable-next-line no-console
        console.log(lcd.green('  "name": "MyRedBot"'));
        // eslint-disable-next-line no-console
        console.log(lcd.green('};'));
        // eslint-disable-next-line no-console
        console.log('');
      }
    }
  }

  return function(type, obj, opts) {
    if (config == null || config.hideNodes == null || config.hideNodes.indexOf(type) === -1) {
      RED.nodes.registerType(type, obj, opts);
    } else {
      // eslint-disable-next-line no-console
      console.log(lcd.warn(`Skipped node ${type}, hidden in configuration`));
    }
  }
};
