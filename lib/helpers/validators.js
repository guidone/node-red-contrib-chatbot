var _ = require('underscore');
var _s = require('underscore.string');


var validators = {

  platform: {
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

  isVariable: function(element) {
    return _.isString(element) && element.match(/^\{\{[A-Za-z0-9_-]*\}\}$/) != null;
  },

  invoiceItem: function(element) {
    return _.isObject(element)
      && _.isString(element.label) && !_.isEmpty(element.label)
      && (
        _.isNumber(element.amount)
        ||
        !_.isEmpty(element.amount) && !isNaN(parseFloat(element.amount))
        ||
        !_.isEmpty(element.amount) && validators.isVariable(element.amount)
      );
  },

  invoiceItems: function(elements) {
    return _.isArray(elements)
      && !_.isEmpty(elements)
      && _(elements).all(function(element) {
        return validators.invoiceItem(element);
      });
  },

  float: function(value) {
    return !isNaN(parseFloat(value));
  },

  button: function(button) {
    return _.isObject(button) && button.type != null;
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
    var re = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return _.isString(url) && url.match(re) != null;
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
  }

};
module.exports = validators;
