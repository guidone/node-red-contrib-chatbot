var _ = require('underscore');
var nlp = require('compromise');
var moment = require('moment');
var utils = require('../lib/helpers/utils');

module.exports = function(RED) {

  var yesWords = ['yes', 'on', 'true', 'yeah', 'ya', 'si'];
  var noWords = ['no', 'off', 'false', 'nei', 'nein'];

  var extractEmail = function(sentence) {
    var re = /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/;
    var matched = sentence.match(re);
    return matched != null ? matched[0] : null;
  };

  function ChatBotParse(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    this.parseType = config.parseType;
    this.parseVariable = config.parseVariable;

    this.on('input', function(msg) {
      msg = RED.util.cloneMessage(msg);
      var parseType = this.parseType;
      var parseVariable = this.parseVariable;
      var chatContext = msg.chat();
      var parsedSentence = null;
      var parsedValue = null;
      var messageType = utils.getType(msg);

      if (_.isObject(msg.payload)) {
        switch (parseType) {
          case 'string':
            parsedValue = msg.payload.content;
            break;
          case 'email':
            parsedValue = extractEmail(msg.payload.content);
            break;
          case 'location':
            if (_.isObject(msg.payload.content) && msg.payload.content.latitude && msg.payload.content.longitude) {
              parsedValue = msg.payload.content;
            }
            break;
          case 'date':
            if (!_.isEmpty(msg.payload.content)) {
              var momented = moment(new Date(msg.payload.content));
              if (momented.isValid()) {
                parsedValue = momented.toDate();
              } else {
                // todo literal
              }
            }
            break;
          case 'response':
            if (messageType === 'response' && _.isObject(msg.payload.content)) {
              parsedValue = msg.payload.content;
            }
            break;
          case 'number-integer':
            if (_.isNumber(msg.payload.content)) {
              parsedValue = Math.round(msg.payload.content);
            } else if (_.isString(msg.payload.content) && msg.payload.content.match(/^[0-9]+$/)) {
              parsedValue = parseInt(msg.payload.content, 10);
            } else {
              parsedSentence = nlp(msg.payload.content);
              if (parsedSentence.values(0)) {
                parsedValue = parsedSentence.values(0).toNumber().out();
                if (!isNaN(parseInt(parsedValue, 10))) {
                  parsedValue = parseInt(parsedValue, 10);
                } else {
                  parsedValue = null;
                }
              }
              parsedValue =_.isNumber(parsedValue) ? parsedValue : null;
            }
            break;
          case 'boolean':
            if (_.isString(msg.payload.content) && _(yesWords).contains(msg.payload.content.toLowerCase())) {
              parsedValue = true;
            } else if (_.isString(msg.payload.content) && _(noWords).contains(msg.payload.content.toLowerCase())) {
              parsedValue = false;
            }
            break;
          case 'photo':
            if (messageType === 'photo' && msg.payload.content instanceof Buffer) {
              parsedValue = msg.payload.content;
            }
            break;
          case 'audio':
            if (messageType === 'audio' && msg.payload.content instanceof Buffer) {
              parsedValue = msg.payload.content;
            }
            break;
          case 'document':
            if (messageType === 'document' && msg.payload.content instanceof Buffer) {
              parsedValue = msg.payload.content;
            }
            break;
          case 'video':
            if (messageType === 'audio' && msg.payload.content instanceof Buffer) {
              parsedValue = msg.payload.content;
            }
            break;
          case 'contact':
            if (_.isObject(msg.payload.content) && msg.payload.content.phone_number != null) {
              parsedValue = msg.payload.content.phone_number;
            }
            break;
        }
      }

      // if parsing ok, then pass through and set variable in context flow
      if (parsedValue != null) {
        if (chatContext != null && !_.isEmpty(parseVariable)) {
          chatContext.set(parseVariable, parsedValue);
        }
        msg.payload = parsedValue;
        node.send([msg, null]);
      } else {
        node.send([null, msg]);
      }

    });
  }
  RED.nodes.registerType('chatbot-parse', ChatBotParse);

};
