const _ = require('lodash');

// inline styles, the html of a message is rendered inside the shadow root of the widget
const LINK_STYLE = 'text-decoration:none;color:inherit;display:inline-block;';
const LIST_STYLE = 'display:flex;flex-wrap:wrap;gap:6px;';
const TEXT_STYLE = 'margin-bottom:6px;';

// RedBot message type -> Deep Chat file type (image | audio | any)
const FILE_TYPES = {
  photo: 'image',
  image: 'image',
  audio: 'audio',
  video: 'any',
  document: 'any'
};

/**
 * @method fileType
 * Translate a RedBot message type into a Deep Chat file type
 * @param {string} type
 * @return {string}
 */
const fileType = type => FILE_TYPES[type] != null ? FILE_TYPES[type] : 'any';

/**
 * @method renderButton
 * Translate a RedBot button into a Deep Chat html snippet. Postback buttons use the
 * "deep-chat-suggestion-button" class: on click Deep Chat submits the button label as a user message.
 * @param {object} button
 * @return {string|null}
 */
const renderButton = button => {
  switch (button.type) {
    case 'postback':
      return `<button class="deep-chat-button deep-chat-suggestion-button">${_.escape(button.label)}</button>`;
    case 'url':
      // Deep Chat renders html messages in its own shadow root: the look of the link can't come from a
      // stylesheet of the hosting page, only from the `deep-chat-button` class and these inline styles
      return `<a class="deep-chat-button" href="${_.escape(button.url)}" target="_blank" rel="noopener noreferrer" `
        + `style="${LINK_STYLE}">${_.escape(button.label)}</a>`;
    case 'newline':
      return '<br/>';
    default:
      return null;
  }
};

/**
 * @method renderButtons
 * Translate a message with buttons (inline-buttons, quick-replies) into a Deep Chat html response
 * @param {object} payload the RedBot payload
 * @return {object}
 */
const renderButtons = payload => {
  const buttons = (payload.buttons || [])
    .map(renderButton)
    .filter(html => html != null)
    .join('\n    ');
  const content = !_.isEmpty(payload.content) ?
    `<div class="redbot-buttons-text" style="${TEXT_STYLE}">${_.escape(payload.content)}</div>\n  ` : '';
  return {
    html: `<div class="redbot-buttons">\n  ${content}`
      + `<div class="redbot-buttons-list" style="${LIST_STYLE}">\n    ${buttons}\n  </div>\n</div>`
  };
};

/**
 * @method renderLocation
 * Translate a location payload into a Deep Chat html response with a link to OpenStreetMap
 * @param {object} payload
 * @return {object}
 */
const renderLocation = payload => {
  const { latitude, longitude } = payload.content || {};
  const label = !_.isEmpty(payload.content?.label) ? payload.content.label : `${latitude}, ${longitude}`;
  const url = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}`
    + `&mlon=${encodeURIComponent(longitude)}#map=16/${encodeURIComponent(latitude)}/${encodeURIComponent(longitude)}`;
  return { html: `<div class="redbot-location"><a href="${_.escape(url)}" target="_blank" rel="noopener noreferrer">${_.escape(label)}</a></div>` };
};

/**
 * @method renderFile
 * Translate a media payload into a Deep Chat file response
 * @param {object} payload
 * @param {string} src public url of the file
 * @return {object}
 */
const renderFile = (payload, src) => ({
  files: [{
    src,
    name: !_.isEmpty(payload.filename) ? payload.filename : payload.type,
    type: fileType(payload.type)
  }]
});

module.exports = {
  fileType,
  renderButton,
  renderButtons,
  renderLocation,
  renderFile
};
