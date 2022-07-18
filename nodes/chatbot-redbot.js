const lcd = require('../lib/helpers/lcd');
const fs = require('fs');
const moment = require('moment');

// get rid of telegram-bot-api warning
process.env.NTBA_FIX_319 = 1;

require('../lib/platforms/telegram');
require('../lib/platforms/slack/index');
require('../lib/platforms/twilio/twilio');
require('../lib/platforms/viber');
require('../lib/platforms/facebook/facebook');

const jsonPackage = fs.readFileSync(__dirname + '/../package.json');
try {
  const pack = JSON.parse(jsonPackage);
  // eslint-disable-next-line no-console
  console.log(lcd.white(moment().format('DD MMM HH:mm:ss')
    + ' - [info] RedBot version:')
    + ' ' + lcd.green(pack.version) + lcd.grey(' (node-red-contrib-chatbot)'));
} catch(e) {
  lcd.error('Unable to open node-red-contrib-chatbot/package.json');
}
