const _ = require('underscore');
const validators = require('./validators');
const request = require('request').defaults({ encoding: null });
const lcd = require('./lcd');
const Path = require('path');
const sanitize = require('sanitize-filename');
const mime = require('mime');

function checkValidators(types, name, value) {
  return _(types).any(function(type) {
    var validator = null;
    switch(type) {
      case 'messages':
        validator = validators.messages;
        break;
      case 'shippingOptions':
        validator = validators.shippingOptions;
        break;
      case 'invoiceItems':
        validator = validators.invoiceItems;
        break;
      case 'buffer':
        validator = validators.buffer;
        break;
      case 'hash':
        validator = function(value) {
          // it's tricky, exclude any object that resemble a message, which is an hash that contains messageId and chatId
          // also the has could be nested in the payload, in that case if the payload has an attribute with the same
          // name of the variable I'm searching for, skip it
          return _.isObject(value) && value.chatId == null && value.messageId == null && value[name] == null;
        };
        break;
      case 'float':
        validator = validators.float;
        break;
      case 'number':
        validator = validators.number;
        break;
      case 'boolean':
        validator = validators.boolean;
        break;
      case 'string':
        validator = validators.string;
        break;
      case 'array':
        validator = validators.array;
        break;
      case 'variable':
        validator = validators.variable;
        break;
      case 'integer':
        validator = validators.integer;
        break;
      case 'params':
          validator = value => {
            return _.isArray(value) && value.every(param => {
              return _.isObject(param) && !_.isEmpty(param.platform) && !_.isEmpty(param.name) && param.value != null;
            });
          };
        break;
      case 'arrayOfString':
        validator = function(value) {
          return _.isArray(value) && _(value).all(function(obj) {
            return _.isString(obj);
          });
        };
        break;
      case 'arrayOfObject':
        validator = function(value) {
          return _.isArray(value) && _(value).all(function(obj) {
            return _.isObject(obj);
          });
        };
        break;
      case 'stringOrNumber':
        validator = value => (_.isString(value) && !_.isEmpty(value)) || _.isNumber(value);
        break;
      case 'buttons':
        validator = function(value) {
          return _.isArray(value) && !_.isEmpty(value) && _(value).all(function(button) {
            // allow buttons with a type or with subitems
            return button != null && (button.type != null || button.items != null);
          });
        };
        break;
      case 'filepath':
        validator = value => _.isString(value) && validators.filepath(value);
        break;
      case 'url':
        validator = value => _.isString(value) && validators.url(value);
        break;
      case 'stringWithVariables':
        validator = value => {
          return _.isString(value) && value.match(/\{\{[A-Za-z0-9]*\}\}/);
        }
        break;
      case 'arrayOfEntities':
        validator = function(value) {
          return _.isArray(value) && !_.isEmpty(value) && _(value).all(entity => {                      
            return entity != null && !_.isEmpty(entity.name) &&
              (entity.aliases == null || (_.isArray(entity.aliases) && _(entity.aliases).all(alias => _.isString(alias))));
          });
        };
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(`Unable to find a validator for type "${type}" in extractValue`);
    }
    return validator(value);
  });
}

const utils = {

  params(msg) {
    return (field, def) => {
      if (msg != null && msg.payload != null && msg.payload.params != null && msg.payload.params[field] != null) {
        return msg.payload.params[field];
      }
      return def;
    }
  },

  request(obj) {
    return new Promise(function(resolve, reject) {
      request(obj, function(error, response, body) {
        if (error != null) {
          reject(error);
        } else {
          resolve(body);
        }
      })
    });
  },

  enrichFilePayload(file, msg = {}, node = {}) {
    file = { ...file }; // clone
    // if filename is still empty then try to use some info of the current node    
    if (_.isEmpty(file.filename)) {
      if (!_.isEmpty(msg.filename)) {
        // try to get filename from a message if it comes from a node-red file node
        file.filename = Path.basename(msg.filename);
      } if (msg.payload != null && !_.isEmpty(msg.payload.filename)) {
        // try to get filename from a message if it comes from a node-red file node
        file.filename = Path.basename(msg.payload.filename);
      } else if (_.isString(msg.payload) && !_.isEmpty(msg.payload) && msg.payload.length < 256) {
        // use from payload, pay attention to huge text files
        file.filename = sanitize(msg.payload);
      } else if (!_.isEmpty(node.name)) {
        file.filename = sanitize(node.name);
      }
    }
    // if mimetype is still empty, try to get from the filename
    if (_.isEmpty(file.mimeType) && !_.isEmpty(file.filename)) {
      file.mimeType = mime.lookup(file.filename);
    }
    // if extension is still empty, try to get from filename
    if (_.isEmpty(file.extension) && !_.isEmpty(file.filename)) {
      file.extension =  Path.extname(file.filename);
    }
    return file;
  },

  message: {
    /**
     * @method isMessage
     * Test if a message is a text message
     * @param {Object} msg
     * @return {Boolean}
     */
    isMessage: function(msg) {
      return msg != null && msg.payload != null && msg.payload.type === 'message' && _.isString(msg.payload.content);
    }
  },

  /**
   * @method isUsedInEnvironment
   * Tells if a nodeId (a configurations node) is used in another node as a development node (in "bot" property) or in
   * a production node (in "botProduction" property)
   * @param {Object} RED
   * @param {String} nodeId
   * @param {String} environment
   * @return {String}
   */
  isUsedInEnvironment: function(RED, nodeId, environment) {
    var isProduction = false;
    var isDevelopment = false;
    RED.nodes.eachNode(function(currentNode) {
      if (currentNode.bot === nodeId) {
        isDevelopment = true;
      }
      if (currentNode.botProduction === nodeId) {
        isProduction = true;
      }
    });
    return (isDevelopment && environment === 'development') || (isProduction && environment === 'production');
  },

  /**
   * @method isUsed
   * Tells if a nodeId (a configurations node) is used in any node
   * @param {Object} RED
   * @param {String} nodeId
   * @return {String}
   */
  isUsed: function(RED, nodeId) {
    var isUsed = false;
    RED.nodes.eachNode(function(currentNode) {
      if (currentNode.bot === nodeId || currentNode.botProduction) {
        isUsed = true;
      }
    });
    return isUsed;
  },

  /**
   * @method when
   * If an object is thenable, then return the object itself, otherwise wrap it into a promise
   * @param {any}
   * @deferred
   */
  when: function (param) {
    if (param != null && _.isFunction(param.then)) {
      return param;
      // eslint-disable-next-line no-undefined
    } else if (param !== undefined) {
      return new Promise(function(resolve) {
        resolve(param);
      });
    }
    return new Promise(function(resolve, reject) {
      reject();
    });
  },

  /**
   * @method extractValue
   * Get values from node config or inbound message, node config always comes first
   * @param {String/Array} types Types of value to search for (any of them)
   * @param {String} name Name of variable (name in config and inbound payload must be the same)
   * @param {Object} node
   * @param {Object} message
   * @param {Boolean} usePayload
   * @return {Any}
   */
  // eslint-disable-next-line max-params
  extractValue: function(types, name, node, message, usePayload = true, useMessage = false, useConfig = true) {
    types = _.isArray(types) ? types : [types];
    usePayload = _.isBoolean(usePayload) ? usePayload : true;
    useMessage = _.isBoolean(useMessage) ? useMessage : false;
    useConfig = _.isBoolean(useConfig) ? useConfig : true;

    // search in this order
    // 1. config
    // 2. payload variable
    // 3. message object of node-red
    // 4. if payload object has a key with the right type
    if (useConfig && checkValidators(types, name, node[name])) {
      return node[name];
    } else if (usePayload && message.payload != null && checkValidators(types, name, message.payload)) {
      return message.payload;
    } else if (useMessage && message != null && checkValidators(types, name, message[name])) {
      return message[name];
    } else if (_.isObject(message.payload) && checkValidators(types, name, message.payload[name])) {
      return message.payload[name];
    } 
    return null;
  },

  /**
   * @method hasValidPayload
   * Check if the message has a valid payload for a sender
   * @return {String}
   */
  hasValidPayload: function(msg) {

    if (msg.payload == null) {
      return 'msg.payload is empty. The node connected to sender is passing an empty payload.';
    }
    if (msg.payload.chatId == null) {
      return 'msg.payload.chatId is empty. Ensure that a RedBot node is connected to the sender node, if the payload'
        + ' is the result of an elaboration from other nodes, connect it to a message node (text, image, etc.)';
    }
    if (msg.payload.type == null) {
      return 'msg.payload.type is empty. Unsupported message type.';
    }
    return null;
  },

  isValidMessage: function(msg, node) {
    if (msg.originalMessage == null || msg.originalMessage.transport == null) {
      lcd.title('Warning: Invalid input message' + (node != null ? ' (id:' + node.id + ')' : ''));
      // eslint-disable-next-line no-console
      console.log(lcd.warn('An invalid message was sent to a RedBot node'));
      // eslint-disable-next-line no-console
      console.log(lcd.grey('RedBot nodes are able to handle messages that are originated from a RedBot node, specifically a'
        + ' receiver node (Telegram Receive, Facebook Receiver, etc.) or a Conversation node.'));
      // eslint-disable-next-line no-console
      console.log(lcd.grey('If you are receiving this it\'s likely because the flow is trying to start a conversation with'
        + ' the chatbot user without adding a "Conversation node" at the beginning of the flow. Please read here:'));
      // eslint-disable-next-line no-console
      console.log('');
      // eslint-disable-next-line no-console
      console.log(lcd.green('https://github.com/guidone/node-red-contrib-chatbot/wiki/Conversation-node'));
      // eslint-disable-next-line no-console
      console.log('');
      return false;
    }
    return true;
  },

  /**
   * @method getChatId
   * Extract a valid chatId from a message
   * @param {Object} msg
   * @return {String}
   */
  getChatId: function(msg) {
    if (_.isObject(msg.payload) && msg.payload.chatId != null) {
      return msg.payload.chatId;
    } else if (msg.originalMessage != null && msg.originalMessage.chatId != null) {
      return msg.originalMessage.chatId;
    } else if (msg.originalMessage != null && msg.originalMessage.chat != null) {
      return msg.originalMessage.chat.id;
    }
    return null;
  },

  getType: function(msg) {
    return msg.payload != null && msg.payload.type != null ? msg.payload.type : null;
  },

  /**
   * @method getMessageId
   * Get message id from a message
   * @param {Object} msg
   * @return {String}
   */
  getMessageId: function(msg) {
    if (msg.payload != null && msg.payload.messageId != null) {
      return msg.payload.messageId;
    } else if (msg.originalMessage != null && msg.originalMessage.messageId != null) {
      return msg.originalMessage.messageId;
    } else if (msg.originalMessage != null && msg.originalMessage.message_id != null) {
      return msg.originalMessage.message_id;
    }
    return null;
  },

  /**
   * @method matchContext
   * Test if topics match (intersection of arrays)
   * @param {String/Array} contexts
   * @param {String/Array} rules
   * @return {Boolean}
   */
  matchContext: function(contexts, rules) {
    contexts = contexts || [];
    rules = rules || [];
    if (rules === '*') {
      return true;
    }
    var arrayRules = _.isArray(rules) ? rules : rules.split(',');
    var arrayContexts = _.isArray(contexts) ? contexts : contexts.split(',');
    return _.intersection(arrayContexts, arrayRules).length !== 0;
  },

  /**
   * @method getTransport
   * Get the transport from a message safely
   * @param {Object} msg
   * @return {String}
   */
  getTransport(msg) {
    return msg != null && msg.originalMessage != null ? msg.originalMessage.transport : null;
  },

  /**
   * @method matchTransport
   * True if the node can be used with the message transport
   * @param {Object} node
   * @param {Object} msg
   * @return {Boolean}
   */
  matchTransport(node, msg) {
    const transports = _.isArray(node.transports) ? _.clone(node.transports) : [];
    transports.push('universal');
    if (!_.contains(transports, utils.getTransport(msg))) {
      node.error(`This node is not available for transport: ${this.getTransport(msg)}`);
      return false;
    }
    return true;
  },

  split: function(message, length) {
    var partials = [];

    while(message.length > 0) {
      var partial = message.substr(0, length);
      partials.push(partial);
      message = message.substr(length);
    }

    return partials;
  },

  /**
   * @method pad
   * Pad a string
   * @param {String} str
   * @param {Number} length
   * @return {String}
   */
  pad: function(str, length) {
    while(str.length < length) {
      str += ' ';
    }
    return str;
  },

  /**
   * @method append
   * Append a payload to a message, if the first or the payload is empty, just replace the object, if it's
   * the first, append to an array
   */
  append: function(message, payload) {
    if (message == null) {
      return null; // do nothing
    }

    if (validators.arrayOfMessage(message.payload)) {
      // if array, then append
      message.payload.push(payload);
    } else if (_.isObject(message.payload) && !_.isEmpty(message.payload.type) && message.payload.inbound === false) {
      message.payload = [message.payload];
      message.payload.push(payload);
    } else {
      message.payload = payload;
    }

    return message;
  },

  /**
   * @method cloneMessage
   * Shallow clone message and payload
   * @param {Object} message
   * @return {Object}
   */
  cloneMessage: function(message) {
    var cloned = _.clone(message);
    cloned.payload = _.clone(message.payload);
    return message;
  },

  /**
   * @method flattenValidationErrors
   * Convert to a readbale and loggable string a validation hash
   * @param {Object} errors
   * @return {String}
   */
  flattenValidationErrors(errors = {}) {
    let result = [];

    _(errors).each((value, key) => {
      if (_.isString(value)) {
        result.push(`${key}: ${value}`)
      } else if (_.isObject(value)) {
        result.push(`${key} -> ${module.exports.flattenValidationErrors(value)}`)
      }
    });

    return result.join(', ');
  }

};

module.exports = utils;
