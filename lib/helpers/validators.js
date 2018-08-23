var _ = require('underscore');
var _s = require('underscore.string');
var URL = require('url');

var validators = {

  platform: {
    universal: function(/*config*/) {
      //config = config || {};
      var result = {};

      // todo verify config

      return _.keys(result).length === 0 ? null : result;
    },
    viber: function(config) {
      config = config || {};
      var result = {};
      if (!_.isString(config.token) || _.isEmpty(config.token)) {
        result.token = 'Missing or invalid access token';
      }
      if (!_.isString(config.webhook) || !validators.url(config.webhook)) {
        result.webhook = 'Missing or invalid webhook';
      }

      return _.keys(result).length === 0 ? null : result;
    },
    slack: function(config) {
      config = config || {};
      var result = {};
      if (!_.isString(config.botname) || _.isEmpty(config.botname)) {
        result.token = 'Missing or invalid access bot name';
      }
      if (!_.isString(config.token) || _.isEmpty(config.token)) {
        result.token = 'Missing or invalid access token';
      }
      if (config.authorizedUsernames != null && !_.isString(config.authorizedUsernames)) {
        result.authorizedUsernames = 'Must be a comma separated list of chatIds';
      }
      if (config.logfile != null && !_.isString(config.logfile)) {
        result.logfile = 'Must be a valid filename';
      }
      _.extend(result, validators.platform.contextProvider(config));
      return _.keys(result).length === 0 ? null : result;
    },
    facebook: function(config) {
      config = config || {};
      var result = {};
      if (!_.isString(config.token) || _.isEmpty(config.token)) {
        result.token = 'Missing or invalid access token';
      }
      if (!_.isString(config.verifyToken)) {
        result.token = 'Missing or invalid access verify token';
      }
      if (!_.isString(config.appSecret) || _.isEmpty(config.appSecret)) {
        result.token = 'Missing or invalid app secret';
      }
      if (config.authorizedUsernames != null && !_.isString(config.authorizedUsernames)) {
        result.authorizedUsernames = 'Must be a comma separated list of chatIds';
      }
      if (config.logfile != null && !_.isString(config.logfile)) {
        result.logfile = 'Must be a valid filename';
      }
      _.extend(result, validators.platform.contextProvider(config));
      return _.keys(result).length === 0 ? null : result;
    },
    telegram: function(config) {
      config = config || {};
      var result = {};
      if (!_.isString(config.token) || _.isEmpty(config.token)) {
        result.token = 'Missing or invalid access token';
      }
      if (config.polling != null && !_.isNumber(config.polling)) {
        result.polling = 'Must be a number';
      }
      if (config.authorizedUsernames != null && !_.isString(config.authorizedUsernames)) {
        result.authorizedUsernames = 'Must be a comma separated list of username or chatIds';
      }
      if (config.logfile != null && !_.isString(config.logfile)) {
        result.logfile = 'Must be a valid filename';
      }
      if (!_(['none', 'html', 'markdown']).contains(config.parseMode)) {
        result.parseMode = 'Must be one of: none, html, markdown';
      }
      _.extend(result, validators.platform.contextProvider(config));
      return _.keys(result).length === 0 ? null : result;
    },
    contextProvider: function(config) {
      config = config || {};
      var result = {};
      var allowedContextProviders = ['memory', 'plain-file'];
      if (config.contextProvider != null && !_(allowedContextProviders).contains(config.contextProvider)) {
        result.contextProvider = 'Invalid context provider, must one of: ' + allowedContextProviders.join(', ');
      }
      if (config.contextParams != null && !_.isObject(config.contextParams)) {
        result.contextProvider = 'Must be a object';
      }
      return _.keys(result).length === 0 ? null : result;
    }
  },

  number: function(value) {
    return _.isNumber(value);
  },

  numberOrVariable: function(value) {
    return _.isNumber(value)
      ||
      (!_.isEmpty(value) && !isNaN(parseFloat(value)))
      ||
      (!_.isEmpty(value) && validators.isVariable(value));
  },

  shippingOption: function(element) {
    return _.isObject(element)
      && _.isString(element.id) && !_.isEmpty(element.id)
      && _.isString(element.label) && !_.isEmpty(element.label)
      && validators.numberOrVariable(element.amount);
  },

  shippingOptions: function(elements) {
    return _.isArray(elements)
      && !_.isEmpty(elements)
      && _(elements).all(function(element) {
        return validators.shippingOption(element);
      });
  },

  variable: function(element) {
    return _.isString(element) && element.match(/^\{\{[A-Za-z0-9_-]*\}\}$/) != null;
  },

  isVariable: function(value) {
    return validators.variable(value); // legacy
  },

  invoiceItem: function(element) {
    return _.isObject(element)
      && _.isString(element.label) && !_.isEmpty(element.label)
      && validators.numberOrVariable(element.amount);
  },

  invoiceItems: function(elements) {
    return _.isArray(elements)
      && !_.isEmpty(elements)
      && _(elements).all(function(element) {
        return validators.invoiceItem(element);
      });
  },

  invoice: function(invoice) {
    var result = validators.string(invoice.title)
      && validators.string(invoice.description)
      && validators.string(invoice.payload)
      && validators.string(invoice.currency)
      && validators.invoiceItems(invoice.prices);

    if (!_.isEmpty(invoice.photoUrl)) {
      result = result && validators.integer(invoice.photoWidth) && validators.integer(invoice.photoHeight);
    }

    return result;
  },

  float: function(value) {
    return !isNaN(parseFloat(value));
  },

  button: function(button) {
    return _.isObject(button) && (button.type != null || validators.buttons(button.items));
  },

  buttons: function(buttons) {
    return _.isArray(buttons)
      && !_.isEmpty(buttons)
      && _(buttons).all(function(button) {
        return validators.button(button);
      });
  },

  genericTemplateElements: function(elements) {
    return _.isArray(elements)
      && !_.isEmpty(elements)
      && _(elements).all(function(element) {
        return validators.genericTemplateElement(element);
      });
  },

  genericTemplateElement: function(element) {
    return _.isObject(element)
      && !_.isEmpty(element.title)
      && _.isString(element.title)
      && _.isArray(element.buttons)
      && (element.buttons.length === 0 || validators.buttons(element.buttons));
  },

  filepath: function(filepath) {
    return _s.startsWith(filepath, './') || _s.startsWith(filepath, '../') || _s.startsWith(filepath, '/');
  },

  url: function(url) {
    if (!_.isString(url)) {
      return false;
    }
    var myUrl = URL.parse(url);
    return _.isString(url) && !_.isEmpty(myUrl.host) && !_.isEmpty(myUrl.hostname) && !_.isEmpty(myUrl.protocol)
      && myUrl.hostname.indexOf('.') !== -1;
  },

  buffer: function(buffer) {
    return buffer instanceof Buffer;
  },

  string: function(value) {
    return _.isString(value) && !_.isEmpty(value);
  },

  boolean: function(value) {
    return _.isBoolean(value);
  },

  array: function(value) {
    return _.isArray(value) && !_.isEmpty(value);
  },

  nlpToken: function(token) {
    return token != null && token.match(/^([a-zA-Z0-9%$£# ]{1,}){0,1}(\[[a-zA-Z0-9]{1,}\]){0,1}(->[a-zA-Z0-9_]{1,}){0,1}$/) != null;
  },

  nlpTokens: function(tokens) {
    return !_.isEmpty(tokens) && _(tokens.split(',')).all(function(token) {
      return validators.nlpToken(token);
    });
  },

  integer: function(value) {
    return !isNaN(parseInt(value, 10));
  },

  messages: function(value) {
    return !_.isEmpty(value) && _.isArray(value) && _(value).all(function(message) {
      // in node config elements are object, in payload are just strings
      return _.isObject(message) ? !_.isEmpty(message.message) : !_.isEmpty(message);
    });
  }

};
module.exports = validators;
