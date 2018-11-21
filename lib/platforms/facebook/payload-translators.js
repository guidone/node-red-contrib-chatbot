var parseButtons = require('./parse-buttons');

module.exports = {
  message: function(payload) {
    return {
      text: payload.content
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
  }
};
