const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const DEFAULT_CDN = 'https://cdn.jsdelivr.net/npm/deep-chat@2.5.1/dist/deepChat.bundle.js';

// the icon of the Deep Chat node in the Node-RED palette, white on transparent: the launcher of the
// floating widget wears the same face. Read once, whitespace collapsed to keep the snippet on one line
let _icon = null;
const nodeIcon = () => {
  if (_icon == null) {
    try {
      _icon = fs.readFileSync(path.join(__dirname, '../../../nodes/icons/deepchat.svg'), 'utf8')
        .replace(/\s*\n\s*/g, '')
        .trim();
    } catch (e) {
      // the package is broken, but a missing icon must not take the test page down
      _icon = '<svg viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">' +
        '<path fill="#FFFFFF" d="M14 12h50a10 10 0 0 1 10 10v26a10 10 0 0 1-10 10H36L18 72V58h-4A10 10 0' +
        ' 0 1 4 48V22a10 10 0 0 1 10-10z"/></svg>';
    }
  }
  return _icon;
};

/**
 * The look of the chat itself, shared by the test page and by both embed variants so that what a visitor
 * copies is what the visitor tried. Only the size belongs to the variant: the widget in a page is as wide
 * as its container, the floating one as wide as its panel
 */
const CHAT_DESIGN = {
  textInput: {
    styles: {
      container: {
        width: '100%',
        margin: '0',
        border: 'unset',
        borderTop: '1px solid #d5d5d5',
        borderRadius: '0px',
        boxShadow: 'unset'
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
  },
  submitButtonStyles: {
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
};
const CHAT_RADIUS = '10px';

const CLOSE_ICON = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M6 6 L18 18 M18 6 L6 18" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" fill="none"/></svg>';

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
    .toolbar * { margin-top: 6px; }
    button.reset {
      font: inherit; font-size: 12px; padding: 4px 10px; border-radius: 6px;
      border: 1px solid #c2c2c2; background: #fff; cursor: pointer;
    }
    #chat-container {
      width: 480px;
    }
    button.reset:hover { background: #fafafa; }
    .embed { width: 100%; max-width: 640px; padding: 0 16px 4px; box-sizing: border-box; }
    .embed summary { font-size: 12px; color: #6b7280; cursor: pointer; }
    .embed .hint { font-size: 11px; color: #6b7280; line-height: 1.6; margin: 8px 0 0; }
    .embed pre {
      background: #fff; border: 1px solid #e0e2e8; border-radius: 6px; padding: 10px;
      font-size: 11px; line-height: 1.5; overflow-x: auto; margin: 8px 0 0;
    }
    main { width: 100%; max-width: 640px; padding: 8px 16px 32px; box-sizing: border-box; }
    @media (prefers-color-scheme: dark) {
      body { background: #16181d; color: #e6e6e6; }
      .meta { color: #9aa0aa; }
      .meta code { background: #2a2e37; }
      button.reset { background: #22262e; border-color: #3a3f4b; color: #e6e6e6; }
      button.reset:hover { background: #2a2e37; }
      .embed summary { color: #9aa0aa; }
      .embed pre { background: #1d2027; border-color: #3a3f4b; }
      .embed .hint { color: #9aa0aa; }
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
      <button class="reset" id="copy-embed">Copy inline markup</button>
      <button class="reset" id="copy-floating">Copy floating markup</button>
      <button class="reset" id="open-codepen">Inline in CodePen</button>
      <button class="reset" id="open-codepen-floating">Floating in CodePen</button>
    </div>
  </header>
  <main>
    <div id="chat-container"></div>
  </main>
  <details class="embed">
    <summary>Inline markup &mdash; the widget sits where you put the tag</summary>
    <pre><code id="embed-code"></code></pre>
  </details>
  <details class="embed">
    <summary>Floating markup &mdash; a launcher in the corner, closed until clicked</summary>
    <pre><code id="floating-code"></code></pre>
  </details>
  <div class="embed">
    <p class="hint">
      The <strong>CodePen</strong> buttons send the same markup to codepen.io. A pen runs on
      <code>https://cdpn.io</code>, so it reaches this bot only if the url in it is reachable from the
      browser (a <code>localhost</code> url works only on the machine running Node-RED) and
      <code>https://cdpn.io</code> is listed in the <em>Allowed origins</em> of the bot.
    </p>
  </div>
  <script type="module">
    // module scripts run in order: the Deep Chat bundle above is already loaded here
    const botId = ${json(botId)};
    const botname = ${json(botname)};
    const endpoint = ${json(endpoint)};
    const wsEndpoint = ${json(wsEndpoint)};
    const isWebSocket = ${json(isWebSocket)};
    const introMessage = ${json(introMessage)};
    const acceptFiles = ${json(acceptFiles)};
    const cdn = ${json(cdn)};
    const publicUrl = ${json(publicUrl)};
    const chatDesign = ${json(CHAT_DESIGN)};
    const chatRadius = ${json(CHAT_RADIUS)};
    const launcherIcon = ${json(nodeIcon())};
    const closeIcon = ${json(CLOSE_ICON)};
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
    // one assignment: setting .style with a string replaces the whole attribute
    chat.style = 'border-radius: ${CHAT_RADIUS}; width: 480px;';
    chat.textInput = ${json(CHAT_DESIGN.textInput)};
    chat.submitButtonStyles = ${json(CHAT_DESIGN.submitButtonStyles)};

    if (introMessage) {
      chat.introMessage = { text: introMessage };
    }
    if (acceptFiles) {
      chat.mixedFiles = true;
      chat.images = true;
    }
    document.getElementById('chat-container').appendChild(chat);

    // The markup to drop this bot into any page: inline, or as a floating launcher. Both are built here
    // and not on the server so that the urls are absolute and reachable, the host of this page being the
    // best guess when the bot declares no public url
    const baseUrl = function() {
      return publicUrl ? publicUrl.replace(/\\/$/, '') : window.location.origin;
    };

    // one conversation per visitor, and it has to come back on the next page load
    const idLines = [
      '  // one stable id per visitor: RedBot keeps the conversation state server side',
      "  const key = 'redbot-deepchat-" + botId + "';",
      '  const newId = function() {',
      "    return 'deepchat-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);",
      '  };',
      '  let chatId;',
      '  try {',
      '    chatId = localStorage.getItem(key);',
      '    if (!chatId) {',
      '      chatId = newId();',
      '      localStorage.setItem(key, chatId);',
      '    }',
      '  } catch (e) {',
      '    // private mode or storage disabled: the conversation restarts with the page',
      '    chatId = newId();',
      '  }'
    ];

    // how the widget reaches this bot, the only part that depends on the connect mode
    const connectLines = function() {
      if (isWebSocket) {
        return [
          '  chat.connect = {',
          "    url: '" + baseUrl().replace(/^http/, 'ws') + wsEndpoint +
            "?chatId=' + chatId + '&userId=' + chatId,",
          '    websocket: true',
          '  };'
        ];
      }
      return [
        '  chat.connect = {',
        "    url: '" + baseUrl() + endpoint + "',",
        "    method: 'POST',",
        '    additionalBodyProps: { chatId: chatId, userId: chatId }',
        '  };'
      ];
    };

    // the look of the chat, exactly the one of this page
    // JSON without the quotes a hand written object would not have: the snippet is meant to be read and
    // edited. A key that is not a plain identifier, or a value holding a quote, is left alone
    const jsLiteral = function(value) {
      return JSON.stringify(value, null, 2)
        .replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, '$1:')
        .replace(/: "([^"'\\\\]*)"/g, ": '$1'");
    };

    const designLines = function() {
      const lines = [];
      ['textInput', 'submitButtonStyles'].forEach(function(name) {
        const assignment = 'chat.' + name + ' = ' + jsLiteral(chatDesign[name]) + ';';
        assignment.split('\\n').forEach(function(line) { lines.push('  ' + line); });
      });
      return lines;
    };

    const optionLines = function() {
      const lines = ['  chat.requestBodyLimits = { maxMessages: 1 };'].concat(designLines());
      if (introMessage) {
        lines.push('  chat.introMessage = { text: ' + JSON.stringify(introMessage) + ' };');
      }
      if (acceptFiles) {
        lines.push('  chat.mixedFiles = true;', '  chat.images = true;');
      }
      return lines;
    };

    const cdnLine = '<script type="module" src="' + cdn + '"><\\/script>';
    const closeScript = '<\\/script>';

    // the widget sitting in the page, where you put the tag
    const embedMarkup = function() {
      return [
        cdnLine,
        '<deep-chat id="redbot-chat" style="width: 350px; height: 520px; border-radius: ' +
          chatRadius + ';"></deep-chat>',
        '',
        '<script type="module">'
      ]
        .concat(idLines)
        .concat(['', "  const chat = document.getElementById('redbot-chat');"])
        .concat(connectLines())
        .concat(optionLines())
        .concat([closeScript])
        .join('\\n');
    };

    // the same widget as a launcher pinned to the bottom right corner, closed until the visitor asks
    const floatingMarkup = function() {
      const label = 'Chat with ' + botname.replace(/"/g, '');
      return [
        cdnLine,
        '',
        '<style>',
        '  #redbot-launcher {',
        '    position: fixed;',
        '    right: 20px;',
        '    bottom: 24px;',
        '    width: 56px;',
        '    height: 56px;',
        '    padding: 0;',
        '    border: 0;',
        '    border-radius: 50%;',
        '    background: #4f46e5;',
        '    cursor: pointer;',
        '    display: flex;',
        '    align-items: center;',
        '    justify-content: center;',
        '    box-shadow: 0 6px 18px rgba(79, 70, 229, 0.45);',
        '    transition: background 0.18s ease, transform 0.18s ease;',
        '    z-index: 2147483001;',
        '  }',
        '  #redbot-launcher:hover { background: #4338ca; transform: translateY(-1px); }',
        '  #redbot-launcher span {',
        '    position: absolute;',
        '    display: flex;',
        '    transition: opacity 0.2s ease, transform 0.24s ease;',
        '  }',
        '  #redbot-launcher svg { width: 28px; height: 28px; display: block; }',
        '  #redbot-launcher .redbot-close { opacity: 0; transform: scale(0.5) rotate(-45deg); }',
        '  #redbot-launcher.redbot-open .redbot-bubble { opacity: 0; transform: scale(0.5) rotate(45deg); }',
        '  #redbot-launcher.redbot-open .redbot-close { opacity: 1; transform: scale(1) rotate(0); }',
        '  #redbot-panel {',
        '    position: fixed;',
        '    right: 20px;',
        '    bottom: 96px;',
        '    width: 350px;',
        '    max-width: calc(100vw - 40px);',
        '    background: #fff;',
        '    border-radius: 12px;',
        '    overflow: hidden;',
        '    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.18);',
        '    opacity: 0;',
        '    visibility: hidden;',
        '    transform: translateY(16px) scale(0.96);',
        '    transform-origin: bottom right;',
        '    transition: opacity 0.24s ease, transform 0.28s cubic-bezier(0.2, 0.9, 0.2, 1),',
        '      visibility 0.28s;',
        '    z-index: 2147483000;',
        '  }',
        '  #redbot-panel.redbot-open {',
        '    opacity: 1;',
        '    visibility: visible;',
        '    transform: translateY(0) scale(1);',
        '  }',
        '  @media (prefers-reduced-motion: reduce) {',
        '    #redbot-panel, #redbot-launcher span { transition: none; }',
        '  }',
        '<\\/style>',
        '',
        '<div id="redbot-panel" role="dialog" aria-label="' + label + '">',
        '  <!-- the panel rounds and clips the widget, so no radius is needed here -->',
        '  <deep-chat id="redbot-chat" style="width: 350px; height: 480px; border: none;"></deep-chat>',
        '</div>',
        '<button id="redbot-launcher" type="button" aria-controls="redbot-panel" aria-expanded="false"',
        '  aria-label="' + label + '" title="Open the chat">',
        '  <span class="redbot-bubble">' + launcherIcon + '</span>',
        '  <span class="redbot-close">' + closeIcon + '</span>',
        '</button>',
        '',
        '<script type="module">'
      ]
        .concat(idLines)
        .concat(['', "  const chat = document.getElementById('redbot-chat');"])
        .concat(connectLines())
        .concat(optionLines())
        .concat([
          '',
          "  const panel = document.getElementById('redbot-panel');",
          "  const launcher = document.getElementById('redbot-launcher');",
          "  const openKey = key + '-open';",
          '',
          '  const setOpen = function(open) {',
          "    panel.classList.toggle('redbot-open', open);",
          "    launcher.classList.toggle('redbot-open', open);",
          "    launcher.setAttribute('aria-expanded', open ? 'true' : 'false');",
          "    launcher.title = open ? 'Close the chat' : 'Open the chat';",
          '    try {',
          "      localStorage.setItem(openKey, open ? '1' : '0');",
          '    } catch (e) {',
          '      // storage disabled: the panel just will not be reopened on the next load',
          '    }',
          '  };',
          '',
          "  launcher.addEventListener('click', function() {",
          "    setOpen(!panel.classList.contains('redbot-open'));",
          '  });',
          '',
          '  // reopen the chat when the visitor left it open',
          '  let wasOpen = false;',
          '  try {',
          "    wasOpen = localStorage.getItem(openKey) === '1';",
          '  } catch (e) {',
          '    wasOpen = false;',
          '  }',
          '  setOpen(wasOpen);',
          closeScript
        ])
        .join('\\n');
    };

    const inlineSnippet = embedMarkup();
    const floatingSnippet = floatingMarkup();

    // navigator.clipboard is only available on a secure context, and a browser that suppresses the
    // permission prompt can leave its promise pending forever: fall back to a throwaway textarea and
    // finally to selecting the block, so the button always tells the visitor what happened
    const wireCopy = function(buttonId, blockId, text) {
      const button = document.getElementById(buttonId);
      const block = document.getElementById(blockId);
      block.textContent = text;

      const flash = function(message) {
        const previous = button.textContent;
        button.textContent = message;
        window.setTimeout(function() { button.textContent = previous; }, 1600);
      };
      const legacyCopy = function() {
        const area = document.createElement('textarea');
        area.value = text;
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
      const selectBlock = function() {
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
        return Promise.race([
          navigator.clipboard.writeText(text),
          new Promise(function(resolve, reject) {
            window.setTimeout(function() { reject(new Error('Clipboard write timed out')); }, 600);
          })
        ]);
      };

      button.addEventListener('click', function() {
        modernCopy().then(
          function() { flash('Copied!'); },
          function() {
            if (legacyCopy()) {
              flash('Copied!');
              return;
            }
            selectBlock();
            flash('Press Ctrl/Cmd+C');
          }
        );
      });
    };

    wireCopy('copy-embed', 'embed-code', inlineSnippet);
    wireCopy('copy-floating', 'floating-code', floatingSnippet);

    // CodePen prefills a new pen from a POSTed form, https://blog.codepen.io/documentation/prefill/
    // Everything goes in the HTML panel: the widget is loaded as an ES module and the JS panel of a pen
    // runs as a classic script, which would set the properties of <deep-chat> before the custom element
    // upgrades and lose them
    const penHtml = function(markup) {
      const notes = [
        '<!--',
        '  RedBot Deep Chat widget for the bot "' + botId + '"' +
          (isWebSocket ? ' (WebSocket)' : ' (HTTP)') + '.',
        '',
        '  A pen runs on https://cdpn.io, not on the host of your Node-RED. For this to answer:',
        '    - the url below must be reachable from this browser: a localhost url only works on the',
        '      machine running Node-RED, set "Public URL" on the bot to get an absolute one here',
        '    - the bot must allow this origin: add https://cdpn.io to "Allowed origins"',
        '-->',
        ''
      ];
      return notes.join('\\n') + markup + '\\n';
    };

    const openPen = function(markup, suffix, css) {
      const pen = {
        title: botname + ' \\u00b7 RedBot Deep Chat' + suffix,
        description: 'Deep Chat widget wired to the RedBot bot "' + botId + '"' +
          (isWebSocket ? ' over a WebSocket' : ' over HTTP'),
        tags: ['redbot', 'node-red', 'deep-chat', 'chatbot'],
        html: penHtml(markup),
        css: css.join('\\n'),
        // one digit per editor, html/css/js: the pen has no js panel
        editors: '110'
      };
      // a prefill is a POST, so it cannot be a plain link
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://codepen.io/pen/define';
      form.target = '_blank';
      const field = document.createElement('input');
      field.type = 'hidden';
      field.name = 'data';
      field.value = JSON.stringify(pen);
      form.appendChild(field);
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    };

    const pageCss = [
      'body {',
      '  margin: 0;',
      '  padding: 16px;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;',
      '}'
    ];

    document.getElementById('open-codepen').addEventListener('click', function() {
      openPen(inlineSnippet, '', pageCss);
    });
    document.getElementById('open-codepen-floating').addEventListener('click', function() {
      openPen(floatingSnippet, ' (floating)', pageCss.concat([
        '',
        '/* something to float over */',
        'body::after {',
        '  content: "Your page content";',
        '  display: block;',
        '  color: #9aa0aa;',
        '  font-size: 13px;',
        '}'
      ]));
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
