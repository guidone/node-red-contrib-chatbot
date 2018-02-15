var lcd = require('../lib/helpers/lcd');
var fs = require('fs');
var moment = require('moment');

var jsonPackage = fs.readFileSync(__dirname + '/../package.json');
try {
  var package = JSON.parse(jsonPackage);
  console.log(lcd.white(moment().format('DD MMM HH:mm:ss')
    + ' - [info] RedBot version:')
    + ' ' + lcd.green(package.version) + lcd.grey(' (node-red-contrib-chatbot)'));
} catch(e) {
  lcd.error('Unable to open node-red-contrib-chatbot/package.json');
}
