var _ = require('underscore');



var validators = {

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
  }

};
module.exports = validators;
