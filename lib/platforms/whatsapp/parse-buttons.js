var _ = require('underscore');

module.exports = function parseButtons(buttons) {
  return _(buttons).chain()
    .map(function(button) {
      var temp = null;
      if (button.type == null && _.isArray(button.items) && !_.isEmpty(button.items)) {
        return {
          title: button.label,
          type: 'nested',
          call_to_actions: parseButtons(button.items)
        }
      } else {
        switch (button.type) {
          case 'url':
            temp = {
              type: 'web_url',
              title: button.label,
              url: button.url
            };
            if (button.webViewHeightRatio != null) {
              temp.webview_height_ratio = button.webViewHeightRatio;
            }
            if (button.extensions != null) {
              temp.messenger_extensions = button.extensions;
            }
            return temp;
          case 'call':
            return {
              type: 'phone_number',
              title: button.label,
              payload: button.number
            };
          case 'postback':
            return {
              type: 'postback',
              title: button.label,
              payload: button.value
            };
          case 'share':
            return {
              type: 'element_share'
            };
          case 'login':
            return {
              type: 'account_link',
              url: button.url
            };
          case 'logout':
            return {
              type: 'account_unlink'
            };
          case 'quick-reply':
            temp = {
              content_type: 'text',
              title: button.label,
              payload: !_.isEmpty(button.value) ? button.value : button.label
            };
            if (!_.isEmpty(button.url)) {
              temp.image_url = button.url;
            }
            return temp;
          case 'phone':
            temp = {
              content_type: 'user_phone_number',
              title: button.label
            };
            if (!_.isEmpty(button.url)) {
              temp.image_url = button.url;
            }
            return temp;
          case 'email':
            temp = {
              content_type: 'user_email',
              title: button.label
            };
            if (!_.isEmpty(button.url)) {
              temp.image_url = button.url;
            }
            return temp;
          case 'location':
            return {
              content_type: 'location'
            };
          default:
            // eslint-disable-next-line no-console
            console.log('Facebook Messenger was not able to use button of type "' + button.type + '"');
            return null;
        }
      }
    })
    .compact()
    .value();
};
