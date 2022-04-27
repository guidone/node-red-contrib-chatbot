var clc = require('cli-color');
var _ = require('underscore');
var prettyjson = require('prettyjson');
var moment = require('moment');

var warn = clc.yellow;
var grey = clc.blackBright;
var green = clc.greenBright;
var white = clc.white;
var orange = clc.xterm(214);
var whiteBright = clc.whiteBright;
var red = clc.red;

var LCD = {

  warn: warn,
  error: orange,
  grey: grey,
  green: green,
  white: white,
  orange: orange,
  red: red,

  timestamp() {
    return LCD.white(moment().format('DD MMM HH:mm:ss') + ' - [info] ');
  },

  dump: function(e, title) {
    this.title(!_.isEmpty(title) ? title : 'Error');
    if (e instanceof Error) {
      Error.captureStackTrace(e);
      var lines = e.stack.split('\n');
      lines.shift();
      lines.shift();
      // is there a better way to get this?
      var reference = e.toString().replace(e.message, '').replace(': ', '');
      // eslint-disable-next-line no-console
      console.log(whiteBright(reference) + ': ' + red(e.message));
      // eslint-disable-next-line no-console
      console.log(this.grey(lines.join('\n')));
    } else {
      // eslint-disable-next-line no-console
      console.log(e);
    }
    // eslint-disable-next-line no-console
    console.log('');
  },

  beautify: function(payload) {
    if (payload == null) {
      return payload;
    }
    payload = _.clone(payload);
    _(payload).each(function(value, key) {
      if (value instanceof Buffer) {
        payload[key] = '<Buffer>';
      } else if (moment.isMoment(value)) {
        payload[key] = value.toString();
      }
    });
    return payload;
  },

  title: function(title) {
    title = ' ' + title + ' ';
    var padding = Math.floor((80 - title.length)/2);
    _.times(padding, function() {
      title = '-' + title;
    });
    while (title.length < 80) {
      title += '-';
    }
    // eslint-disable-next-line no-console
    console.log(grey(title));
  },

  node: function(obj, options) {

    options = _.extend({
      nodeId: null,
      title: null,
      color: function(value) {
        return value;
      }
    }, options);

    // eslint-disable-next-line no-console
    console.log('');

    var title = '';
    if (!_.isEmpty(options.title)) {
      title += options.title;
    }
    if (options.node != null) {
      title += ' (id:' + options.node.id + ')';
    }

    if (!_.isEmpty(title)) {
      title = ' ' + title + ' ';
      var padding = Math.floor((80 - title.length)/2);
      _.times(padding, function() {
        title = '-' + title;
      });
      while (title.length < 80) {
        title += '-';
      }
      // eslint-disable-next-line no-console
      console.log(grey(title));
    }

    if (_.isString(obj)) {
      // eslint-disable-next-line no-console
      console.log(options.color(obj));
    } else {
      // eslint-disable-next-line no-console
      console.log(prettyjson.render(LCD.beautify(obj)));
    }
    // eslint-disable-next-line no-console
    console.log('');
  }

};

module.exports = LCD;
