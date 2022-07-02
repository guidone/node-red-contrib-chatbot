var clc = require('cli-color');
var _ = require('lodash');
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
    } else if (_.isArray(e)) {
      // eslint-disable-next-line no-console
      console.log(prettyjson.render(LCD.beautify(e)));
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
      } else if (value instanceof moment) {
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

  prettify: function(obj, { indent = 0 } = {}) {
    let rendered = prettyjson.render(LCD.beautify(obj));
    if (_.isNumber(indent) && indent != 0) {
      rendered = '  ' + rendered.replace(/[\n]/g, '\n  ');
    }
    return rendered;
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
  },

  graphQLError: (error, node) => {
    // eslint-disable-next-line no-console
    console.log('---', error)
    if (error != null && error.networkError != null && error.networkError.result != null && error.networkError.result.errors != null) {
      let errors = error.networkError.result.errors.map(error => {
        let errorMsg = error.message;
        if (error.locations != null) {
          errorMsg += ` (line: ${error.locations[0].line})`;
        }
        return errorMsg;
      });
      LCD.dump(errors, `GraphQL Error (id: ${node.id}${!_.isEmpty(node.name) ? ', name: ' + node.name : ''})`);
    } else if (error.graphQLErrors) {
      LCD.dump(error.graphQLErrors, `GraphQL Error (id: ${node.id}${!_.isEmpty(node.name) ? ', name: ' + node.name : ''})`);
      //console.log(error.graphQLErrors);
    } else {
      LCD.dump('Unknown GraphQL error', `GraphQL Error (id: ${node.id}${!_.isEmpty(node.name) ? ', name: ' + node.name : ''})`);
      // eslint-disable-next-line no-console
      console.log(error);
    }
  },

  textGraphQLError: (error) => {
    if (error != null && error.networkError != null && error.networkError.result != null && error.networkError.result.errors != null) {
      let errors = error.networkError.result.errors.map(error => {
        let errorMsg = error.message;
        if (error.locations != null) {
          errorMsg += ` (line: ${error.locations[0].line})`;
        }
        return errorMsg;
      });
      return errors;
    } else if (error.graphQLErrors) {
      return error.graphQLErrors;
    } else {
      return 'Unknown GraphQL error';
    }
  }

};

module.exports = LCD;
