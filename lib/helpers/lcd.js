var clc = require('cli-color');
var _ = require('underscore');
var prettyjson = require('prettyjson');

var warn = clc.yellow;
var grey = clc.blackBright;
var green = clc.greenBright;
var white = clc.white;
var orange = clc.xterm(214);

module.exports = {

  warn: warn,
  grey: grey,
  green: green,
  white: white,
  orange: orange,

  node: function(obj, options) {

    options = _.extend({
      nodeId: null,
      title: null
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

    // eslint-disable-next-line no-console
    console.log(prettyjson.render(obj))
  }


};
