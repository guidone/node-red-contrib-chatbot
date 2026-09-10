const assert = require('chai').assert;

const widget = require('../lib/platforms/deepchat/widget');

/**
 * The test page builds the embed markup in the browser, so that the urls are absolute. Run its inline
 * script against a minimal DOM shim: it produces the snippet through the real code path and it fails
 * loudly on a syntax error in the generated page (the script is inlined in a template literal, an
 * escape that collapses one level too far is easy to miss)
 */
const runPage = (options, context = {}) => {
  const html = widget(options);
  // the opening tag of the page script, not the ones that appear inside the snippet strings
  const source = html.split('<script type="module">\n')[1].split('</script>')[0];

  const nodes = {};
  const created = [];
  const submitted = [];
  const makeNode = id => ({
    id,
    textContent: '',
    style: {},
    open: false,
    listeners: {},
    children: [],
    appendChild(child) { this.children.push(child); },
    setAttribute() {},
    select() {},
    submit() { submitted.push(this); },
    closest() { return makeNode('details'); },
    addEventListener(name, callback) { this.listeners[name] = callback; }
  });
  const document = {
    getElementById(id) {
      if (nodes[id] == null) {
        nodes[id] = makeNode(id);
      }
      return nodes[id];
    },
    createElement: tag => {
      const node = makeNode(tag);
      created.push(node);
      return node;
    },
    createRange: () => ({ selectNodeContents() {} }),
    body: { appendChild() {}, removeChild() {} }
  };
  // the pen is prefilled by POSTing a form, there's no url to inspect
  const openedPen = () => {
    const form = submitted[submitted.length - 1];
    if (form == null) {
      return null;
    }
    return { form, data: JSON.parse(form.children[0].value) };
  };
  const store = {};
  const localStorage = {
    getItem: key => (store[key] != null ? store[key] : null),
    setItem: (key, value) => { store[key] = value; }
  };
  const window = {
    location: {
      origin: context.origin || 'http://localhost:1880',
      protocol: context.protocol || 'http:',
      host: context.host || 'localhost:1880',
      reload() {}
    },
    localStorage,
    getSelection: () => ({ removeAllRanges() {}, addRange() {} }),
    setTimeout: () => 0
  };
  // eslint-disable-next-line no-new-func
  new Function('document', 'window', 'navigator', 'localStorage', source)(
    document, window, { clipboard: null }, localStorage
  );
  return {
    html,
    nodes,
    openedPen,
    // the <deep-chat> the page built for itself, with everything it applied to it
    pageChat: created.find(node => node.id === 'deep-chat'),
    snippet: nodes['embed-code'].textContent
  };
};

/**
 * Evaluate one `chat.<name> = { ... };` of a snippet back into an object, to compare it with what the
 * page applied to its own widget
 */
const literalOf = (markup, name) => {
  const prefix = 'chat.' + name + ' = ';
  const start = markup.indexOf(prefix);
  if (start === -1) {
    return null;
  }
  const end = markup.indexOf('\n  };', start);
  const text = markup.slice(start + prefix.length, end + 4);
  // eslint-disable-next-line no-new-func
  return new Function('return ' + text)();
};

const httpBot = {
  botId: 'my-bot',
  botname: 'My Bot',
  endpoint: '/redbot/deepchat/my-bot',
  wsEndpoint: '/redbot/deepchat/my-bot/ws',
  connectMode: 'http',
  acceptFiles: true
};
const socketBot = { ...httpBot, connectMode: 'websocket' };

describe('Deep Chat test page', function() {

  it('never emits a raw closing script tag inside the page script', function() {
    // only the cdn tag and the closing tag of the page script itself: a third one would cut the script
    ['http', 'websocket'].forEach(connectMode => {
      const html = widget({ ...httpBot, connectMode, introMessage: 'Hi' });
      assert.lengthOf(html.split('</script>'), 3, `${connectMode} mode`);
    });
  });

  it('wires the copy button', function() {
    const { nodes } = runPage(httpBot);
    assert.isFunction(nodes['copy-embed'].listeners.click);
  });

  it('builds the embed markup of an http bot', function() {
    const { snippet } = runPage(httpBot);

    assert.include(snippet, '<deep-chat id="redbot-chat"');
    assert.include(snippet, 'src="https://cdn.jsdelivr.net/npm/deep-chat');
    assert.include(snippet, "url: 'http://localhost:1880/redbot/deepchat/my-bot'");
    assert.include(snippet, "method: 'POST'");
    assert.include(snippet, 'additionalBodyProps: { chatId: chatId, userId: chatId }');
    assert.include(snippet, 'chat.requestBodyLimits = { maxMessages: 1 };');
    // the conversation has to survive a reload
    assert.include(snippet, "const key = 'redbot-deepchat-my-bot';");
    assert.include(snippet, 'localStorage.setItem(key, chatId);');
    assert.notInclude(snippet, 'websocket: true');
  });

  it('builds the embed markup of a WebSocket bot', function() {
    const { snippet } = runPage(socketBot);

    assert.include(snippet, "url: 'ws://localhost:1880/redbot/deepchat/my-bot/ws?chatId=' + chatId + '&userId=' + chatId,");
    assert.include(snippet, 'websocket: true');
    assert.notInclude(snippet, "method: 'POST'");
    // Deep Chat uploads files as multipart, there's no way to do it over a socket
    assert.notInclude(snippet, 'chat.mixedFiles');
  });

  it('offers the attachments of an http bot only when it accepts files', function() {
    assert.include(runPage(httpBot).snippet, 'chat.mixedFiles = true;');
    assert.notInclude(runPage({ ...httpBot, acceptFiles: false }).snippet, 'chat.mixedFiles');
  });

  it('carries the intro message over to the snippet, escaped', function() {
    const { snippet } = runPage({ ...httpBot, introMessage: 'Hi! I\'m "the" bot' });
    assert.include(snippet, 'chat.introMessage = { text: "Hi! I\'m \\"the\\" bot" };');
  });

  it('wires the CodePen button', function() {
    const { nodes } = runPage(httpBot);
    assert.isFunction(nodes['open-codepen'].listeners.click);
  });

  it('prefills a pen that POSTs to CodePen and opens in a new tab', function() {
    const page = runPage(httpBot);
    page.nodes['open-codepen'].listeners.click();
    const { form, data } = page.openedPen();

    assert.equal(form.method, 'POST');
    assert.equal(form.action, 'https://codepen.io/pen/define');
    assert.equal(form.target, '_blank');
    assert.equal(form.children[0].name, 'data');
    assert.include(data.title, 'My Bot');
    assert.include(data.description, 'my-bot');
    // one digit per editor, html/css/js
    assert.equal(data.editors, '110');
  });

  it('puts the whole widget in the HTML panel of the pen', function() {
    const page = runPage(socketBot);
    page.nodes['open-codepen'].listeners.click();
    const { data } = page.openedPen();

    // the JS panel of a pen runs as a classic script: it would set the properties of <deep-chat>
    // before the element upgrades and lose them, so the module script has to live in the HTML
    assert.include(data.html, '<script type="module"');
    assert.include(data.html, '<deep-chat id="redbot-chat"');
    assert.include(data.html, 'websocket: true');
    assert.isUndefined(data.js);

    // what a visitor has to know for the pen to reach the bot
    assert.include(data.html, 'https://cdpn.io');
    assert.include(data.html, 'Allowed origins');
  });

  it('sends the same markup to the pen that the copy button gives', function() {
    const page = runPage(httpBot);
    page.nodes['open-codepen'].listeners.click();
    assert.include(page.openedPen().data.html, page.snippet);
  });

  it('wires a copy button for each variant', function() {
    const { nodes } = runPage(httpBot);
    assert.isFunction(nodes['copy-embed'].listeners.click);
    assert.isFunction(nodes['copy-floating'].listeners.click);
  });

  it('builds the floating variant closed, with the launcher in the corner', function() {
    const { nodes } = runPage(socketBot);
    const floating = nodes['floating-code'].textContent;

    // the panel is closed until the visitor asks for it
    assert.include(floating, '#redbot-panel {');
    assert.include(floating, '  visibility: hidden;');
    assert.include(floating, '#redbot-panel.redbot-open {');

    // pinned bottom right, with room from the edges, and 350px wide
    assert.include(floating, '  width: 350px;');
    assert.include(floating, '  right: 20px;\n    bottom: 96px;');
    assert.include(floating, '  right: 20px;\n    bottom: 24px;');

    // a circular indigo launcher wearing the icon of the Deep Chat node
    assert.include(floating, '  background: #4f46e5;');
    assert.include(floating, '  border-radius: 50%;');
    assert.include(floating, '  width: 56px;');
    assert.include(floating, 'viewBox="0 0 90 90"');
    assert.include(floating, 'fill="#FFFFFF"');

    // and it animates
    assert.include(floating, 'transition: opacity 0.24s ease, transform 0.28s cubic-bezier');
    assert.include(floating, 'prefers-reduced-motion');
  });

  it('remembers whether the floating chat was left open', function() {
    const floating = runPage(socketBot).nodes['floating-code'].textContent;

    assert.include(floating, "const openKey = key + '-open';");
    assert.include(floating, "localStorage.setItem(openKey, open ? '1' : '0');");
    assert.include(floating, "wasOpen = localStorage.getItem(openKey) === '1';");
    assert.include(floating, '  setOpen(wasOpen);');
    // the launcher toggles, so it has to be able to close too
    assert.include(floating, "setOpen(!panel.classList.contains('redbot-open'));");
  });

  it('gives the floating variant the same connection as the inline one', function() {
    ['http', 'websocket'].forEach(connectMode => {
      const page = runPage({ ...httpBot, connectMode });
      const inline = page.nodes['embed-code'].textContent;
      const floating = page.nodes['floating-code'].textContent;
      const connectOf = markup => markup.slice(markup.indexOf('chat.connect'), markup.indexOf('requestBodyLimits'));

      assert.equal(connectOf(floating), connectOf(inline), `${connectMode} mode`);
      // the same conversation, whichever variant the page embeds
      assert.include(floating, "const key = 'redbot-deepchat-my-bot';");
    });
  });

  it('survives a browser with no storage in both variants', function() {
    const { nodes } = runPage(socketBot);
    // localStorage throws in private mode, it must not take the widget down
    [nodes['embed-code'].textContent, nodes['floating-code'].textContent].forEach(markup => {
      assert.include(markup, '  try {\n    chatId = localStorage.getItem(key);');
      assert.include(markup, '    chatId = newId();');
    });
  });

  it('opens a pen of either variant', function() {
    const page = runPage(socketBot);

    page.nodes['open-codepen'].listeners.click();
    const inlinePen = page.openedPen().data;
    assert.include(inlinePen.html, '<deep-chat id="redbot-chat"');
    assert.notInclude(inlinePen.html, 'redbot-launcher');

    page.nodes['open-codepen-floating'].listeners.click();
    const floatingPen = page.openedPen().data;
    assert.include(floatingPen.title, '(floating)');
    assert.include(floatingPen.html, 'redbot-launcher');
    assert.include(floatingPen.css, 'Your page content');
  });

  it('gives both variants the same chat design as the test page', function() {
    const page = runPage(httpBot);
    const inline = page.nodes['embed-code'].textContent;
    const floating = page.nodes['floating-code'].textContent;

    ['textInput', 'submitButtonStyles'].forEach(name => {
      // what the page applied to its own widget, and what it hands out, have to be the same thing
      assert.deepEqual(literalOf(inline, name), page.pageChat[name], `inline ${name}`);
      assert.deepEqual(literalOf(floating, name), page.pageChat[name], `floating ${name}`);
    });

    // the visible bits of that design
    [inline, floating].forEach(markup => {
      assert.include(markup, "text: 'Type a message...'");
      assert.include(markup, "color: '#bcbcbc'");
      assert.include(markup, "borderTop: '1px solid #d5d5d5'");
      assert.include(markup, "transform: 'scale(1.21)'");
    });
  });

  it('writes the design as readable javascript, not as JSON', function() {
    const inline = runPage(httpBot).nodes['embed-code'].textContent;
    assert.include(inline, '    styles: {');
    assert.notInclude(inline, '"styles"');
  });

  it('rounds the inline widget like the page, and lets the panel round the floating one', function() {
    const { nodes } = runPage(socketBot);
    assert.include(nodes['embed-code'].textContent, 'border-radius: 10px;"');
    // the panel clips the widget, a radius on both would fight
    assert.include(nodes['floating-code'].textContent, '  border-radius: 12px;');
    assert.notInclude(nodes['floating-code'].textContent, 'height: 480px; border: none; border-radius');
  });

  it('prefers the public url of the bot over the host of the page', function() {
    const { snippet } = runPage({ ...httpBot, publicUrl: 'https://mybot.example.com/' });
    assert.include(snippet, "url: 'https://mybot.example.com/redbot/deepchat/my-bot'");
  });

  it('turns an https public url into a wss socket url', function() {
    const { snippet } = runPage({ ...socketBot, publicUrl: 'https://mybot.example.com' });
    assert.include(snippet, "url: 'wss://mybot.example.com/redbot/deepchat/my-bot/ws?chatId='");
  });

  it('follows the scheme of the page when the bot has no public url', function() {
    const { snippet } = runPage(socketBot, { origin: 'https://secure.example.com' });
    assert.include(snippet, "url: 'wss://secure.example.com/redbot/deepchat/my-bot/ws?chatId='");
  });
});
