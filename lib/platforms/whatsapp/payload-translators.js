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
  receiptTemplate: function(json, param) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'receipt',
          sharable: param('sharable', false),
          ...json
        }
      }
    };
  },
  customerFeedbackTemplate: function(json) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'customer_feedback',
          ...json
        }
      }
    };
  },
  productTemplate: function(payload) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'product',
          elements: payload.elements
        }
      }
    }
  },
  mediaTemplate: function(payload, param) {
    // translate elements into facebook format
    const buttons = payload.elements.map(item => {
      const element = {
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
    const mediaElement = {
      media_type: payload.mediaType
    };
    if (!_.isEmpty(payload.attachmentId)) {
      mediaElement.attachment_id = payload.attachmentId;
    }
    if (!_.isEmpty(payload.mediaUrl)) {
      mediaElement.url = payload.mediaUrl;
    }
    if (!_.isEmpty(buttons)) {
      mediaElement.buttons = buttons;
    }

    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'media',
          sharable: param('sharable', false),
          elements: [mediaElement]
        }
      }
    }
  },
  genericTemplate: function(payload, param) {
    // translate elements into facebook format
    const elements = payload.elements.map(item => {
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
          image_aspect_ratio: param('aspectRatio', 'horizontal'),
          elements: elements
        }
      }
    }
  },
  buttonTemplate: function(payload) {
    return {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: payload.text,
          buttons: parseButtons(payload.buttons)
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
