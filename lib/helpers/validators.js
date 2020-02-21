var _ = require('underscore');
var _s = require('underscore.string');
var URL = require('url');
var mime = require('mime-types')

var validators = {

  platform: {
    discord: function(config) {
      config = config || {};
      var result = {};
      if (config.authorizedUsernames != null && !_.isString(config.authorizedUsernames)) {
        result.authorizedUsernames = 'Must be a comma separated list of chatIds';
      }
      if (config.logfile != null && !_.isString(config.logfile)) {
        result.logfile = 'Must be a valid filename';
      }
      _.extend(result, validators.platform.contextProvider(config));
      return _.keys(result).length === 0 ? null : result;
    },
    alexa: function(config) {
      config = config || {};
      var result = {};
      if (config.authorizedUsernames != null && !_.isString(config.authorizedUsernames)) {
        result.authorizedUsernames = 'Must be a comma separated list of chatIds';
      }
      if (config.logfile != null && !_.isString(config.logfile)) {
        result.logfile = 'Must be a valid filename';
      }
      _.extend(result, validators.platform.contextProvider(config));
      return _.keys(result).length === 0 ? null : result;
    },
    twilio: function(config) {
      config = config || {};
      var result = {};
      if (!_.isString(config.authToken) || _.isEmpty(config.authToken)) {
        result.token = 'Missing or invalid auth token';
      }
      if (!_.isString(config.accountSid) || _.isEmpty(config.accountSid)) {
        result.token = 'Missing or invalid account Sid';
      }
      if (!_.isString(config.fromNumber) || _.isEmpty(config.fromNumber)) {
        result.token = 'Missing or invalid Twilio number';
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
    universal: function(/*config*/) {
      //config = config || {};
      var result = {};

      // todo verify config

      return _.keys(result).length === 0 ? null : result;
    },
    routee: function(config) {
      config = config || {};
      const result = {};
      if (!_.isString(config.accessToken) || _.isEmpty(config.accessToken)) {
        result.token = 'Missing or invalid access token';
      }
      if (!_.isString(config.appSecret) || _.isEmpty(config.appSecret)) {
        result.token = 'Missing or invalid application secret';
      }
      if (!_.isString(config.appId) || _.isEmpty(config.appId)) {
        result.token = 'Missing or invalid application id';
      }
      if (!_.isString(config.fromNumber) || _.isEmpty(config.fromNumber)) {
        result.token = 'Missing or invalid Twilio number';
      }
      if (config.logfile != null && !_.isString(config.logfile)) {
        result.logfile = 'Must be a valid filename';
      }
      _.extend(result, validators.platform.contextProvider(config));

      return _.keys(result).length === 0 ? null : result;
    },
    msteams: function(config) {
      config = config || {};
      var result = {};
      if (!_.isString(config.appId) || _.isEmpty(config.appId)) {
        result.token = 'Missing or invalid appId';
      }
      if (!_.isString(config.appPassword) || _.isEmpty(config.appPassword)) {
        result.token = 'Missing or invalid account appPassword';
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
        result.token = 'Missing or invalid bot name';
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
      if (config.profileFields != null && !_.isString(config.profileFields)) {
        result.profileFields = 'Invalid list of profile fields';
      }
      if (!_.isString(config.appSecret) || _.isEmpty(config.appSecret)) {
        result.appSecret = 'Missing or invalid app secret';
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
      if (config.connectMode != null && !_(['polling', 'webHook']).contains(config.connectMode)) {
        result.connectMode = 'Must be one of: polling, webHook';
      }
      if (config.connectMode === 'webHook' && !validators.url(config.webHook)) {
        result.webHook = 'Invalid Url';
      }
      if (config.connectMode === 'webHook' && !validators.secureUrl(config.webHook)) {
        result.webHook = 'Webhook Url must be secure (https)';
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

  invoiceItem(element) {
    return validators.invoiceItemErrors(element) == null;
  },

  invoiceItemErrors(element) {
    let result = {};

    if (!_.isObject(element)) {
      result.price = 'Invalid price element';
    }
    if (!_.isString(element.label)) {
      result.label = 'Missing or invalid label';
    }
    if (!validators.numberOrVariable(element.amount)) {
      result.amount = 'Missing or invalid amount (must be number or variable)';
    }

    return !_.isEmpty(result) ? result : null;
  },

  invoiceItems(elements) {
    return validators.invoiceItemsErrors(elements) == null;
  },

  invoiceItemsErrors(elements) {
    let result = {};

    if (!_.isArray(elements)) {
      result.prices = 'Missing invoice items';
      return result;
    }
    if (_.isEmpty(elements)) {
      result.prices = 'Empty invoice items';
      return result;
    }
    // check each items
    elements.forEach((element, idx) => {
      const validate = validators.invoiceItemErrors(element);
      if (validate != null) {
        result[`prices[${idx}]`] = validate;
      }
    });

    return !_.isEmpty(result) ? result : null;
  },

  invoice(invoice) {
    return validators.invoiceErrors(invoice) == null;
  },

  invoiceErrors(invoice) {
    let result = {};

    if (!validators.string(invoice.title)) {
      result.title = 'Missing invoice title';
    }
    if (!validators.string(invoice.description)) {
      result.description = 'Missing invoice description';
    }
    if (!validators.string(invoice.payload)) {
      result.payload = 'Missing invoice payload';
    }
    if (!validators.string(invoice.currency)) {
      result.currency = 'Missing currency';
    }
    if (!validators.invoiceItems(invoice.prices)) {
      result = { ...validators.invoiceItemsErrors(invoice.prices), ...result };
    }
    // check photo
    if (!_.isEmpty(invoice.photoUrl)) {
      if (!validators.integer(invoice.photoWidth)) {
        result.photoWidth = 'Missing or invalida photoWidth';
      }
      if (!validators.integer(invoice.photoHeight)) {
        invoice.photoHeight = 'Missing or invalid photoHeight'
      }
    }

    return !_.isEmpty(result) ? result : null;
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

  filepath(filepath) {
    return _s.startsWith(filepath, './') 
      || _s.startsWith(filepath, '../') 
      || _s.startsWith(filepath, '/')
      || _s.startsWith(filepath, '__tests__');
  },

  url: function(url) {
    if (!_.isString(url)) {
      return false;
    }
    var myUrl = URL.parse(url);
    return _.isString(url) && !_.isEmpty(myUrl.host) && !_.isEmpty(myUrl.hostname) && !_.isEmpty(myUrl.protocol)
      && myUrl.hostname.indexOf('.') !== -1;
  },

  secureUrl: function(url) {
    return validators.url(url) && url.toLowerCase().startsWith('https');
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
  },

  arrayOfMessage: function(value) {
    return _.isArray(value)
      && _(value).all(function(item) { return _.isObject(item) && !_.isEmpty(item.type); });
  },

  filenameIsImage: function(str) {
    if (!_.isEmpty(str)) {
      var mimeType = mime.lookup(str);
      return mimeType.indexOf('image') !== -1;
    }
    return false;
  },

  path: function(value) {
    return typeof value === 'string' && value.length !== 0 && value.match(/^[A-Za-z0-9_-]*$/);
  }

};
module.exports = validators;
