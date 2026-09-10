const _ = require('lodash');

// inline styles, the html of a message is rendered inside the shadow root of the widget
const LINK_STYLE = 'text-decoration:none;color:inherit;display:inline-block;';
const LIST_STYLE = 'display:flex;flex-wrap:wrap;gap:6px;';
const TEXT_STYLE = 'margin-bottom:6px;';

// the animated dots of a waiting message, one keyframes rule shared by the three of them
const WAITING_DOT_STYLE = 'width:0.45em;height:0.45em;border-radius:50%;background-color:#848484;'
  + 'animation:redbot-waiting-dots 1s infinite alternate;';
const WAITING_KEYFRAMES = '@keyframes redbot-waiting-dots{0%{opacity:1}50%,100%{opacity:0.2}}';
const WAITING_STYLE = 'display:flex;align-items:center;gap:0.35em;padding:0.15em 0;';
const WAITING_LABEL_STYLE = 'font-size:0.92em;opacity:0.7;margin-inline-end:0.25em;';

/**
 * What the visitor reads next to the dots for every waiting type of the *Waiting* node. Deep Chat has no
 * status line to write into (nothing like Telegram's "upload_photo"), so anything that is not plain
 * typing has to be spelled out in the bubble itself
 */
const WAITING_LABELS = {
  typing: null,
  upload_photo: 'Uploading a photo',
  record_video: 'Recording a video',
  upload_video: 'Uploading a video',
  record_audio: 'Recording an audio',
  upload_audio: 'Uploading an audio',
  upload_document: 'Uploading a document',
  find_location: 'Finding the location'
};

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
 * @method renderWaiting
 * Translate an `action` payload (the *Waiting* node) into a Deep Chat html response: the animated dots
 * of a chat that is composing, with the label of the waiting type when it's not plain typing.
 *
 * The outermost element carries the `deep-chat-temporary-message` class, which is where Deep Chat looks
 * for it: a temporary message is dropped by the widget the moment the next message arrives, exactly the
 * lifetime of a typing indicator. The animation ships with the bubble (a `<style>` inside the wrapper,
 * so it lives and dies with it) instead of borrowing the internal classes of the widget's own loader
 * @param {object} payload the RedBot payload, `waitingType` picks the label
 * @return {object}
 */
const renderWaiting = payload => {
  const waitingType = !_.isEmpty(payload.waitingType) ? payload.waitingType : 'typing';
  const label = WAITING_LABELS[waitingType];
  const dots = [0, 0.33, 0.66]
    .map(delay => `<span style="${WAITING_DOT_STYLE}animation-delay:${delay}s;"></span>`)
    .join('\n  ');
  return {
    html: `<div class="deep-chat-temporary-message redbot-waiting" style="${WAITING_STYLE}">\n  `
      + (!_.isEmpty(label) ? `<span class="redbot-waiting-label" style="${WAITING_LABEL_STYLE}">${_.escape(label)}</span>\n  ` : '')
      + `${dots}\n  <style>${WAITING_KEYFRAMES}</style>\n</div>`
  };
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
  renderWaiting,
  renderFile
};
