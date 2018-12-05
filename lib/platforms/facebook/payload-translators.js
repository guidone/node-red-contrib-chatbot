var _ = require('underscore');
var parseButtons = require('./parse-buttons');

var PayloadTranslators = {
  dynamicMessage: function(payload) {
    if (payload.content.indexOf('{{first_name}}') !== -1 || payload.content.indexOf('{{last_name}}') !== -1) {
      return {
        dynamic_text: {
          text: payload.content,
          fallback_text: !_.isEmpty(payload.fallback) ? payload.fallback : payload.content
        }
      }
    } else {
      return PayloadTranslators.message(payload);
    }

  },
  message: function(payload) {
    return {
      text: payload.content
    };
  },
  inlineButtons: function(payload) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: payload.content,
          buttons: parseButtons(payload.buttons)
        }
      }
    };
  },
  genericTemplate: function(payload) {
    // translate elements into facebook format
    var elements = payload.elements.map(function(item) {
      var element = {
        title: item.title,
        buttons: parseButtons(item.buttons)
      };
      if (!_.isEmpty(item.subtitle)) {
        element.subtitle = item.subtitle;
      }
      if (!_.isEmpty(item.imageUrl)) {
        element.image_url = item.imageUrl;
      }
      return element;
    });

    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          image_aspect_ratio: payload.aspectRatio,
          sharable: payload.sharable,
          elements: elements
        }
      }
    }
  },
  listTemplate: function(payload) {
    // translate elements into facebook format
    var elements = payload.elements.map(function(item) {
      var element = {
        title: item.title,
        buttons: parseButtons(item.buttons)
      };
      if (!_.isEmpty(item.subtitle)) {
        element.subtitle = item.subtitle;
      }
      if (!_.isEmpty(item.imageUrl)) {
        element.image_url = item.imageUrl;
      }
      return element;
    });

    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: payload.topElementStyle,
          sharable: payload.sharable,
          elements: elements
        }
      }
    };
  }
};

module.exports = PayloadTranslators;
