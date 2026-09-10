const _ = require('lodash');

const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/deep-chat@2.5.1/dist/deepChat.bundle.js';

// serialize a value for inlining in a <script> tag
const json = value => JSON.stringify(value != null ? value : null).replace(/</g, '\\u003c');

/**
 * @method widget
 * Render the test page hosting a Deep Chat widget already wired to this bot endpoint
 * @param {object} options
 * @param {string} options.botId
 * @param {string} options.botname
 * @param {string} options.endpoint absolute path of the message endpoint (i.e. /redbot/deepchat/my-bot)
 * @param {string} [options.wsEndpoint] absolute path of the socket endpoint, required in WebSocket mode
 * @param {string} [options.connectMode=http] `http` or `websocket`
 * @param {string} [options.publicUrl] base url of the embed snippet, defaults to the host of the page
 * @param {string} [options.introMessage]
 * @param {string} [options.cdn] url of the Deep Chat bundle
 * @param {boolean} [options.acceptFiles=true] show the file attachment button
 * @return {string}
 */
module.exports = function widget(options = {}) {
  const { botId, endpoint, wsEndpoint, publicUrl } = options;
  const botname = !_.isEmpty(options.botname) ? options.botname : botId;
  const cdn = !_.isEmpty(options.cdn) ? options.cdn : DEFAULT_CDN;
  const introMessage = !_.isEmpty(options.introMessage) ? options.introMessage : null;
  const isWebSocket = options.connectMode === 'websocket';
  // Deep Chat serializes attachments as multipart, which has no equivalent on a socket
  const acceptFiles = options.acceptFiles !== false && !isWebSocket;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${_.escape(botname)} &middot; Deep Chat</title>
  <script type="module" src="${_.escape(cdn)}"></script>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f4f5f7;
      color: #24292f;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    header { width: 100%; max-width: 640px; padding: 24px 16px 8px; box-sizing: border-box; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .meta { font-size: 12px; color: #6b7280; line-height: 1.6; word-break: break-all; }
    .meta code { background: #e7e9ee; border-radius: 4px; padding: 1px 4px; }
    .toolbar { margin-top: 10px; }
    button.reset {
      font: inherit; font-size: 12px; padding: 4px 10px; border-radius: 6px;
      border: 1px solid #c2c2c2; background: #fff; cursor: pointer;
    }
    #chat-container {
      width: 480px;
    }
    button.reset:hover { background: #fafafa; }
    .embed { width: 100%; max-width: 640px; padding: 0 16px; box-sizing: border-box; }
    .embed summary { font-size: 12px; color: #6b7280; cursor: pointer; }
    .embed pre {
      background: #fff; border: 1px solid #e0e2e8; border-radius: 6px; padding: 10px;
      font-size: 11px; line-height: 1.5; overflow-x: auto; margin: 8px 0 0;
    }
    main { width: 100%; max-width: 640px; padding: 8px 16px 32px; box-sizing: border-box; }
    .redbot-buttons-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .redbot-buttons-list a { text-decoration: none; color: inherit; display: inline-block; }
    @media (prefers-color-scheme: dark) {
      body { background: #16181d; color: #e6e6e6; }
      .meta { color: #9aa0aa; }
      .meta code { background: #2a2e37; }
      button.reset { background: #22262e; border-color: #3a3f4b; color: #e6e6e6; }
      button.reset:hover { background: #2a2e37; }
      .embed summary { color: #9aa0aa; }
      .embed pre { background: #1d2027; border-color: #3a3f4b; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${_.escape(botname)}</h1>
    <div class="meta">
      Test page for the RedBot Deep Chat connector &mdash; bot id <code>${_.escape(botId)}</code><br/>
      endpoint <code>${_.escape(isWebSocket ? wsEndpoint : endpoint)}</code>
      ${isWebSocket ? '(WebSocket, attachments are not available over a socket)' : '(HTTP)'}<br/>
      chat id <code id="chat-id"></code>
    </div>
    <div class="toolbar">
      <button class="reset" id="reset">New conversation</button>
      ${isWebSocket ? '<button class="reset" id="reconnect">Reconnect</button>' : ''}
      <button class="reset" id="copy-embed">Copy embed markup</button>
    </div>
  </header>
  <main>
    <div id="chat-container"></div>
  </main>
  <details class="embed">
    <summary>Embed markup for this bot</summary>
    <pre><code id="embed-code"></code></pre>
  </details>
  <script type="module">
    // module scripts run in order: the Deep Chat bundle above is already loaded here
    const botId = ${json(botId)};
    const endpoint = ${json(endpoint)};
    const wsEndpoint = ${json(wsEndpoint)};
    const isWebSocket = ${json(isWebSocket)};
    const introMessage = ${json(introMessage)};
    const acceptFiles = ${json(acceptFiles)};
    const cdn = ${json(cdn)};
    const publicUrl = ${json(publicUrl)};
    const storageKey = 'redbot-deepchat-' + botId;

    const newChatId = () => 'deepchat-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

    let chatId;
    try {
      chatId = window.localStorage.getItem(storageKey);
      if (!chatId) {
        chatId = newChatId();
        window.localStorage.setItem(storageKey, chatId);
      }
    } catch (e) {
      // private mode or storage disabled, the chat won't survive a reload
      chatId = newChatId();
    }
    document.getElementById('chat-id').textContent = chatId;

    const chat = document.createElement('deep-chat');
    if (isWebSocket) {
      // Deep Chat doesn't add "additionalBodyProps" to a socket frame: the conversation is identified by
      // the upgrade request, which is also what makes a reconnection resume the same conversation and
      // receive whatever the flow produced in the meantime
      const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const query = new URLSearchParams({ chatId, userId: chatId });
      chat.connect = {
        url: scheme + '://' + window.location.host + wsEndpoint + '?' + query.toString(),
        websocket: true
      };
    } else {
      chat.connect = {
        url: endpoint,
        method: 'POST',
        additionalBodyProps: { chatId, userId: chatId }
      };
    }
    // RedBot keeps the conversation state server side, no need to replay the history
    chat.requestBodyLimits = { maxMessages: 1 };
    chat.style.width = '480px';
    chat.style.height = '720px';
    chat.style = 'border-radius: 10px;width:480px;'
    chat.textInput = {
      styles: {
        container: {
          width: '100%',
          margin: '0',
          border: 'unset',
          borderTop: '1px solid #d5d5d5',
          borderRadius: '0px',
          "boxShadow": "unset"
        },
        text: {
          fontSize: '1.05em',
          paddingTop: '11px',
          paddingBottom: '13px',
          paddingLeft: '12px',
          paddingRight: '2.4em'
        }
      },
      placeholder: {
        text: 'Type a message...', 
        style: { color: '#bcbcbc' } 
      }
    };
    chat.submitButtonStyles = {
      submit: {
        container: {
          default: {
            transform: 'scale(1.21)',
            marginBottom: '-3px',
            marginRight: '0.4em'
          }
        }
      }
    }

    if (introMessage) {
      chat.introMessage = { text: introMessage };
    }
    if (acceptFiles) {
      chat.mixedFiles = true;
      chat.images = true;
    }
    document.getElementById('chat-container').appendChild(chat);

    // The markup to drop the same bot into any page. It's built here and not on the server so that the
    // urls are absolute and reachable: the host of this page is the best guess when the bot doesn't
    // declare a public url. Written with string concatenation, the snippet itself contains backticks
    const embedMarkup = function() {
      const origin = publicUrl ? publicUrl.replace(/\\/$/, '') : window.location.origin;
      const lines = [
        '<script type="module" src="' + cdn + '"><\\/script>',
        '<deep-chat id="redbot-chat" style="width: 100%; height: 520px;"></deep-chat>',
        '',
        '<script type="module">',
        '  // one stable id per visitor: RedBot keeps the conversation state server side',
        "  const key = 'redbot-deepchat-" + botId + "';",
        '  let chatId = localStorage.getItem(key);',
        '  if (!chatId) {',
        "    chatId = 'deepchat-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);",
        '    localStorage.setItem(key, chatId);',
        '  }',
        '',
        "  const chat = document.getElementById('redbot-chat');"
      ];
      if (isWebSocket) {
        lines.push(
          '  chat.connect = {',
          "    url: '" + origin.replace(/^http/, 'ws') + wsEndpoint + "?chatId=' + chatId + '&userId=' + chatId,",
          '    websocket: true',
          '  };'
        );
      } else {
        lines.push(
          '  chat.connect = {',
          "    url: '" + origin + endpoint + "',",
          "    method: 'POST',",
          '    additionalBodyProps: { chatId: chatId, userId: chatId }',
          '  };'
        );
      }
      lines.push('  chat.requestBodyLimits = { maxMessages: 1 };');
      if (introMessage) {
        lines.push("  chat.introMessage = { text: " + JSON.stringify(introMessage) + " };");
      }
      if (acceptFiles) {
        lines.push('  chat.mixedFiles = true;', '  chat.images = true;');
      }
      lines.push('<\\/script>');
      return lines.join('\\n');
    };

    const snippet = embedMarkup();
    document.getElementById('embed-code').textContent = snippet;

    const copyButton = document.getElementById('copy-embed');
    const flash = function(text) {
      const previous = copyButton.textContent;
      copyButton.textContent = text;
      window.setTimeout(function() { copyButton.textContent = previous; }, 1600);
    };
    // navigator.clipboard is only available on a secure context: the test page is often opened on a
    // plain http host, so fall back to a throwaway textarea and finally to selecting the block
    const legacyCopy = function() {
      const area = document.createElement('textarea');
      area.value = snippet;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (e) {
        copied = false;
      }
      document.body.removeChild(area);
      return copied;
    };
    const selectSnippet = function() {
      const block = document.getElementById('embed-code');
      block.closest('details').open = true;
      const range = document.createRange();
      range.selectNodeContents(block);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    };
    const modernCopy = function() {
      if (!(navigator.clipboard && navigator.clipboard.writeText)) {
        return Promise.reject(new Error('Clipboard API not available'));
      }
      // a browser that suppresses the permission prompt can leave the promise pending forever: without
      // a deadline the button would look dead and the fallback would never run
      return Promise.race([
        navigator.clipboard.writeText(snippet),
        new Promise(function(resolve, reject) {
          window.setTimeout(function() { reject(new Error('Clipboard write timed out')); }, 600);
        })
      ]);
    };
    copyButton.addEventListener('click', function() {
      modernCopy().then(
        function() { flash('Copied!'); },
        function() {
          if (legacyCopy()) {
            flash('Copied!');
            return;
          }
          selectSnippet();
          flash('Press Ctrl/Cmd+C');
        }
      );
    });

    // Deep Chat leaves reconnection to the page: reloading re-opens the socket with the same chat id,
    // the messages the flow produced while it was closed are delivered right after the handshake
    const reconnect = document.getElementById('reconnect');
    if (reconnect) {
      reconnect.addEventListener('click', () => window.location.reload());
    }

    document.getElementById('reset').addEventListener('click', () => {
      try {
        window.localStorage.removeItem(storageKey);
      } catch (e) {
        // ignore
      }
      window.location.reload();
    });
  </script>
</body>
</html>
`;
};

module.exports.DEFAULT_CDN = DEFAULT_CDN;
