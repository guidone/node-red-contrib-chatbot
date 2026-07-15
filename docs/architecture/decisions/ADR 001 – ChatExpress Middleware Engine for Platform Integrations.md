# **ADR 001 – ChatExpress Middleware Engine for Platform Integrations**

**Status:** Accepted (documented retroactively)
**Date:** 2026-07-15
**Authors:** REDBot maintainers

---

## **Context**

REDBot supports many chat platforms (Telegram, Facebook Messenger, Slack,
Discord, Sinch, Viber, WhatsApp). Each has a different webhook payload shape,
a different SDK, and different send options, yet the Node-RED flows above them
must see a single, normalized message model regardless of which platform a
conversation runs on.

We needed one abstraction that could: transform raw webhook payloads into
normalized messages, run per-platform inbound/outbound transformation logic in
a predictable order, expose configurable send options to the Node-RED editor,
and persist per-conversation state — without every platform reinventing that
plumbing.

## **Decision**

Adopt **ChatExpress** (the `chat-platform` package, pinned to `3.0.0`) as the
middleware engine underneath every platform integration. Each platform is a
`ChatExpress` instance configured with payload extractors and lifecycle hooks,
and its behavior is composed from **inbound (`.in()`) and outbound (`.out()`)
middleware chains**. Platform implementations live in `lib/platforms/`; the
sender factory at [`lib/sender-factory/index.js`](../../../lib/sender-factory/index.js)
boots them and wires them to Node-RED.

The message pipeline is:

```
[Platform Webhook]
    ↓
Platform.receive(rawPayload)
    ↓
[Inbound middleware chain]  ← .in() handlers run in registration order
    ↓
[Node-RED flow]
    ↓
node.chat.send(message)
    ↓
[Outbound middleware chain] ← .out() handlers matched by message type
    ↓
[Platform API call]
```

### Creating a platform

```js
const ChatExpress = require('chat-platform');

const MyPlatform = new ChatExpress({
  transport: 'myplatform',           // unique identifier
  transportDescription: 'My Platform',
  color: '#336699',

  // Extract IDs from raw platform payloads
  chatIdKey: payload => payload.chat.id,
  userIdKey: payload => payload.from.id,
  messageIdKey: payload => payload.message_id,
  tsKey: payload => payload.date,

  // Classify incoming messages
  type: payload => {
    if (payload.text) return 'message';
    if (payload.photo) return 'photo';
  },

  // Lifecycle hooks
  onStart: function() {
    const { token } = this.getOptions();
    return new PlatformSDK(token); // returned value becomes the connector
  },
  onStop: function() {
    const { connector } = this.getOptions();
    connector.stop();
  },

  // Webhook routes (Express-style)
  routes: {
    '/redbot/myplatform': function(req, res) {
      this.receive(req.body);
      res.send({ status: 'ok' });
    }
  }
});
```

#### Constructor options

| Option | Type | Description |
|--------|------|-------------|
| `transport` | string | Unique platform identifier |
| `transportDescription` | string | Human-readable name |
| `color` | string | UI accent color (hex) |
| `chatIdKey` | `fn(payload)` | Extract conversation ID from raw payload |
| `userIdKey` | `fn(payload)` | Extract user ID |
| `messageIdKey` | `fn(payload)` | Extract message ID |
| `tsKey` | `fn(payload)` | Extract timestamp |
| `type` | `fn(payload)` | Classify message type (`'message'`, `'photo'`, etc.) |
| `language` | `fn(payload)` | Extract language code (optional) |
| `onStart` | `fn()` | Called when bot starts — return the connector instance |
| `onStop` | `fn()` | Called when bot stops |
| `onCreateMessage` | `fn(obj)` | Transform the raw message object before middleware runs |
| `routes` | object | Express route handlers keyed by path |
| `multiWebHook` | boolean | Support multiple webhook subpaths |
| `relaxChatId` | boolean | Allow null chatId (for events like inline queries) |
| `events` | object | Handlers for platform-specific event types |

### Middleware API

#### Inbound middleware — `.in()`

Runs on every incoming message before it reaches the Node-RED flow. Use it to
normalize payloads, download media, and persist user state.

```js
// Runs for all message types
MyPlatform.in(function(message) {
  message.payload.content = message.originalMessage.text;
  return message; // must return message (or a Promise resolving to it)
});

// Runs only for a specific type
MyPlatform.in('photo', async function(message) {
  const buffer = await downloadFile(message.originalMessage.photo[0].file_id);
  message.payload.content = buffer;
  return message;
});
```

#### Outbound middleware — `.out()`

Runs on every outgoing message before it is sent to the platform API. Use it to
map Node-RED message fields to platform-specific API parameters.

```js
// Runs for all message types (catch-all)
MyPlatform.out(function(message) {
  // fallback handler
  return message;
});

// Runs only for 'message' type
MyPlatform.out('message', async function(message) {
  const { connector } = this.getOptions();
  const param = params(message);

  const result = await connector.sendMessage(
    message.payload.chatId,
    message.payload.content,
    { disable_notification: param('silent', false) }
  );

  await message.chat().set({ lastMessageId: result.message_id });
  return message;
});
```

**Rules for both:**
- Must `return message` (or a Promise resolving to it) to continue the chain
- Throw a string or Error to abort the chain and surface an error
- Access bot config with `this.getOptions()` (inside regular functions, not arrow functions)

### The message object

```js
{
  payload: {
    type: 'message' | 'photo' | 'location' | 'event' | ...,
    content: 'text' | Buffer | { latitude, longitude } | ...,
    chatId: '123456',
    userId: '789',
    messageId: 'msg_456',
    caption: 'optional',       // for media types
    // additional fields set by .in() middleware
  },

  originalMessage: {
    // Raw platform payload — Telegram update, FB event, Slack event, etc.
    transport: 'telegram',
    chatId: '123456',
    userId: '789',
    ...
  },

  chat: function() { /* returns context store — see below */ },
  client: function() { /* returns connector (platform SDK instance) */ }
}
```

### Chat context

Each conversation has a key-value store that persists across messages. Access
it via `message.chat()`.

```js
const context = message.chat();

// Read one or more keys
const { firstName, language } = await context.get('firstName', 'language');

// Write (merged — doesn't overwrite unrelated keys)
await context.set({ firstName: 'Guido', language: 'it' });

// Read everything
const allVars = await context.all();

// Remove specific keys
await context.remove('tempKey');

// Wipe the conversation state
await context.clear();
```

#### Context providers

| Provider | Config | Notes |
|----------|--------|-------|
| `memory` | — | Default. Lost on restart. |
| `plain-file` | `contextParams.path` | File-based persistence. |
| `sqlite` | — | Used in Mission Control mode. |

### Platform parameters

Parameters are configurable send options exposed to Node-RED node UIs. Register
them so Mission Control can show them as node fields. The registration pattern
and conventions are covered in
[ADR 002 – Platform Parameter Registration Pattern](ADR%20002%20%E2%80%93%20Platform%20Parameter%20Registration%20Pattern.md).

```js
// Register
MyPlatform.registerParam('silent', 'boolean', {
  label: 'Silent notification',
  default: false,
  description: 'Deliver without notification sound'
});

// Read inside .out() middleware
const param = params(message);
const isSilent = param('silent', false);
```

### Message types

Register the message types your platform can send. These appear in node
configuration dropdowns and enable type-specific validation.

```js
MyPlatform.registerMessageType('message', 'Message', 'Send a plain text message');

MyPlatform.registerMessageType('video', 'Video', 'Send a video file', (file) => {
  if (file.size > 50 * 1024 * 1024) return 'File too large (max 50 MB)';
  return null; // valid
});
```

### Lifecycle methods

```js
MyPlatform.start()   // initialize, calls onStart
MyPlatform.stop()    // shutdown, calls onStop

// Listen for platform errors
MyPlatform.on('error', (error) => { /* ... */ });
MyPlatform.on('warning', (warning) => { /* ... */ });

// Listen for incoming messages (used internally by receiver nodes)
MyPlatform.on('message', (message) => { /* ... */ });
```

### Adding custom methods

Use `mixin()` to attach helper methods to the platform instance:

```js
MyPlatform.mixin({
  downloadFile(url) {
    return fetch(url).then(r => r.buffer());
  }
});

// Available as this.downloadFile() inside middlewares
MyPlatform.in(async function(message) {
  const buffer = await this.downloadFile(url);
  return message;
});
```

### Full example — minimal platform

```js
const ChatExpress = require('chat-platform');
const SDK = require('my-platform-sdk');

const MyPlatform = new ChatExpress({
  transport: 'myplatform',
  transportDescription: 'My Platform',
  chatIdKey: p => p.chat_id,
  userIdKey: p => p.user_id,
  messageIdKey: p => p.id,
  tsKey: p => p.timestamp,
  type: p => p.photo ? 'photo' : 'message',
  onStart: function() {
    const { token } = this.getOptions();
    const bot = new SDK(token);
    bot.on('message', payload => this.receive(payload));
    return bot;
  },
  onStop: function() {
    this.getOptions().connector.disconnect();
  }
});

// Inbound: extract text
MyPlatform.in(function(message) {
  message.payload.content = message.originalMessage.text;
  return message;
});

// Inbound: persist user info
MyPlatform.in(async function(message) {
  const ctx = message.chat();
  const { firstName } = await ctx.get('firstName');
  if (!firstName) {
    await ctx.set({ firstName: message.originalMessage.user.name });
  }
  return message;
});

// Outbound: send text
MyPlatform.out('message', async function(message) {
  const { connector } = this.getOptions();
  await connector.send(message.payload.chatId, message.payload.content);
  return message;
});

// Register types and params
MyPlatform.registerMessageType('message', 'Message', 'Send text');
MyPlatform.registerParam('silent', 'boolean', { label: 'Silent', default: false });

module.exports = MyPlatform;
```

### Where to find the platform implementations

| Platform | Entry point |
|----------|-------------|
| Telegram | [`lib/platforms/telegram.js`](../../../lib/platforms/telegram.js) |
| Facebook | [`lib/platforms/facebook/facebook.js`](../../../lib/platforms/facebook/facebook.js) |
| Slack | [`lib/platforms/slack/index.js`](../../../lib/platforms/slack/index.js) |
| Discord | [`lib/platforms/discord.js`](../../../lib/platforms/discord.js) |
| Sinch | [`lib/platforms/sinch.js`](../../../lib/platforms/sinch.js) |
| Viber | [`lib/platforms/viber.js`](../../../lib/platforms/viber.js) |
| WhatsApp | [`lib/platforms/whatsapp/index.js`](../../../lib/platforms/whatsapp/index.js) |

The sender factory that boots platforms and wires them to Node-RED is at
[`lib/sender-factory/index.js`](../../../lib/sender-factory/index.js).

## **Consequences**

### ✅ Positive

* Every platform presents the same normalized message model to Node-RED flows,
  so nodes work across all transports without platform-specific branches.
* Cross-cutting behavior (media download, state persistence, param mapping) is
  expressed as small, ordered middleware rather than tangled per-platform code.
* Adding a platform is implementing a `ChatExpress` config plus `.in()`/`.out()`
  handlers — the receive/route/context plumbing is inherited.

### ⚠️ Trade-offs / Risks

* A third-party dependency (`chat-platform`) sits on the critical path of every
  message; its API shape and version (`3.0.0`) constrain platform code.
* Middleware ordering and the "always `return message`" contract are conventions
  enforced only by review — a handler that forgets to return silently stalls the
  chain.
* `this.getOptions()` requires regular (non-arrow) functions in middleware, an
  easy footgun.

## **Alternatives Considered**

| Option | Pros | Cons | Reason Not Chosen |
| --- | --- | --- | --- |
| Per-platform bespoke handlers | No shared abstraction to learn | Every platform reinvents normalization, routing, and state; flows need per-platform branches | Defeats the goal of one normalized model |
| Generic web framework (raw Express) per platform | Familiar | No message model, no middleware-by-type, no context store — all built by hand | ChatExpress already provides these |
| Fork/inline the middleware engine into the repo | Full control, no external dep | Maintenance burden; loses upstream fixes | External package is stable and shared |
