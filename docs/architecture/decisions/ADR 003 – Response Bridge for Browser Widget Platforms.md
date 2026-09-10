# **ADR 003 – Response Bridge for Browser Widget Platforms**

**Status:** Accepted
**Date:** 2026-09-09
**Authors:** REDBot maintainers

---

## **Context**

Every platform integrated so far (Telegram, Facebook, Slack, Sinch, Viber,
WhatsApp) is **push based in both directions**: inbound messages arrive on a
webhook, outbound messages leave with a separate API call to the platform, at any
time and in any number. The ChatExpress engine described in
[ADR 001 – ChatExpress Middleware Engine for Platform Integrations](ADR%20001%20%E2%80%93%20ChatExpress%20Middleware%20Engine%20for%20Platform%20Integrations.md)
mirrors exactly that shape: `.in()` normalizes a webhook payload, `.out()` calls
the platform API, and the two halves are completely decoupled.

[Deep Chat](https://deepchat.dev/) breaks that assumption. It is a web component
running in the visitor's browser that talks to its backend with a plain
**request/response** HTTP call: it POSTs the message the user typed and renders
whatever comes back in that same response. The browser is not addressable — there
is no callback URL to push a later message to, and no platform API behind which
to hide one.

A RedBot flow, on the other hand, answers asynchronously and can produce zero,
one or many messages for a single inbound one (a text, then an image, then a set
of quick replies), possibly seconds later, and can also produce messages
completely out of band (the *Push Message* node). Folding that onto a single HTTP
response — without asking flow authors to write Deep Chat flows differently from
every other platform — is the problem this ADR settles.

> **Superseded in part by
> [ADR 004 – WebSocket Endpoints in ChatExpress](ADR%20004%20%E2%80%93%20WebSocket%20Endpoints%20in%20ChatExpress.md).**
> The response bridge described here is still the default (`connectMode: http`)
> and the only mode that can receive file uploads, but a Deep Chat bot can now
> run on a WebSocket instead, where the bridge is replaced by a connection hub
> and most of the trade-offs listed below do not apply.

## **Decision**

Implement Deep Chat as a **regular ChatExpress platform** under
`lib/platforms/deepchat/`, and reconcile the two models inside the platform with
a **response bridge**: a per-conversation rendezvous between the inbound route
holding an HTTP response open and the `.out()` middleware that would normally
call a platform API.

```
[Deep Chat widget]
    │  POST /redbot/deepchat/<botId>   { messages: [{ role, text }], chatId }
    ▼
bridge.open(chatId) ───────────────────────────┐   collecting window opens
    │                                          │
Platform.receive(payload)                      │
    ▼                                          │
[Inbound middleware] → [Node-RED flow] → node.chat.send(message)
                                                │            │
                                                │            ▼
                                                │   [Outbound middleware]
                                                │            │
                                                └─── bridge.push(chatId, response)
    ┌───────────────────────────────────────────┘
    ▼
HTTP 200  [{ text }, { files }, { html }]      window closes on quiet or timeout
```

### The bridge

1. The route handler **opens a collecting window** for the conversation *before*
   handing the message to `chatServer.receive()` — the flow may answer
   immediately.
2. Every `.out()` handler renders the RedBot message into a Deep Chat response
   object and **pushes it into the bridge** instead of calling a platform API.
3. The window closes on the first of: no new message for `collectWindow`
   milliseconds (default `400`), or `timeout` milliseconds since the request
   started (default `20000`). The HTTP response is the JSON array of everything
   collected — Deep Chat accepts an array of responses, and an empty array
   renders nothing.
4. Messages produced while **no request is in flight** — a *Push Message* node,
   or a flow that answered after the timeout — are **buffered per conversation**
   and delivered with the next round trip, so nothing is silently dropped.

The route side:

```js
// open the window before the flow runs, the answer may be immediate
const collecting = chatServer.bridge.open(chatId);
chatServer.receive({ chatId, userId, messageId, type: 'message', text });
res.json(await collecting);
```

The middleware side — there is no API call, the response is handed to whoever is
waiting:

```js
DeepChat.out('message', async function(message) {
  return push(this, message, { text: message.payload.content, role: 'ai' });
});
```

### Conversation identity

There is no platform-assigned chat id. The widget sends a `chatId`
(`additionalBodyProps`; the test page generates one and keeps it in
`localStorage`). When it is absent the connector falls back to the
`x-redbot-chatid` header and then to a cookie it sets itself, so that a bare
`<deep-chat>` tag with no wiring still gets a stable conversation instead of a
new one per message.

### Media

There is no platform CDN to upload to and no public URL to hand the widget.
Buffers produced by the flow are stored in the existing `FileCache` (one hour)
and served back from a per-bot route, `/redbot/deepchat/<botId>/files/<id>`,
prefixed with the optional `publicUrl` when the widget is embedded elsewhere.

### Routes and the botId

The bot id is a **path segment in the middle** of the endpoint
(`/redbot/deepchat/<botId>`, `/redbot/deepchat/<botId>/widget`), which the
`multiWebHook` + `webHookScheme` mechanism of ADR 001 cannot express — it can only
*append* a suffix to a route. Since ChatExpress mounts routes as anchored regular
expressions, the routes are declared with a wildcard segment and each handler
compares the botId in the path against its own configuration, declining the
request otherwise:

```js
routes: {
  '/redbot/deepchat/[^/]+': function(req, res, next) {
    if (_.last(segmentsOf(req)) !== this.getOptions().botId) {
      next(); // another Deep Chat bot is mounted on the same wildcard route
      return;
    }
    handleMessage(this, req, res);
  }
}
```

This keeps several Deep Chat bots independent on the same Node-RED instance.

### Buttons without a postback channel

Deep Chat's `deep-chat-suggestion-button` submits the button's **text content**
as an ordinary user message; there is no payload channel equivalent to Telegram's
`callback_data`. To preserve RedBot's postback semantics — flows match on the
button `value`, not on its label — the outbound handler stores the buttons in the
chat context under `deepchatLastButtons`, and an inbound middleware translates a
text matching a button label back into that button's value before the flow sees
it, then clears the key.

### Where to find the implementation

| Concern | File |
| --- | --- |
| Platform definition, routes, in/out middleware | [`lib/platforms/deepchat/index.js`](../../../lib/platforms/deepchat/index.js) |
| Response bridge | [`lib/platforms/deepchat/bridge.js`](../../../lib/platforms/deepchat/bridge.js) |
| RedBot message → Deep Chat response | [`lib/platforms/deepchat/renderer.js`](../../../lib/platforms/deepchat/renderer.js) |
| Test page served on `/widget` | [`lib/platforms/deepchat/widget.js`](../../../lib/platforms/deepchat/widget.js) |
| Node-RED nodes | [`nodes/chatbot-deepchat-receive.js`](../../../nodes/chatbot-deepchat-receive.js) |

Send options follow the registration pattern of
[ADR 002 – Platform Parameter Registration Pattern](ADR%20002%20%E2%80%93%20Platform%20Parameter%20Registration%20Pattern.md).

## **Consequences**

### ✅ Positive

* A Deep Chat page talks to a RedBot flow with no webhook to register, no token
  and no third-party account: the widget and the flow are enough. Unlike the
  webhook platforms it needs no public address, and unlike Telegram's polling
  mode it needs no external service to poll.
* Flows are authored exactly like for any other platform — the asynchronous,
  multi-message model survives intact. The bridge, not the flow author, absorbs
  the request/response mismatch.
* Nothing the flow produces is lost: late and out-of-band messages surface on the
  next round trip instead of disappearing into a closed response.
* The mismatch is confined to one small module with a narrow API
  (`open`/`push`/`destroy`), so it is unit-testable without HTTP and reusable by
  any future browser-widget platform.

### ⚠️ Trade-offs / Risks

* Every answer pays the `collectWindow` latency (400ms by default) — the price of
  gathering several flow messages into one response.
* A message produced after the `timeout` is delivered on the user's *next*
  message, which can read as out of order in the transcript.
* Buffers live in memory, keyed by conversation, and are only drained by the user
  coming back — there is no eviction. A flow pushing to many idle conversations
  grows them unboundedly.
* The wildcard routes mean every Deep Chat bot mounts a handler that sees the
  requests of all the others before declining them; only the botId check keeps
  them apart. Two bots configured with the same botId will both answer.
* Unlike a webhook platform, delivery is not acknowledged by anyone: if the
  browser navigates away mid-request the response is dropped and, unlike the
  out-of-band case, not buffered.
* Nothing can be shown to the visitor *between* the request and its response, so
  the *Waiting* node (`action`) is a no-op in this mode — Deep Chat is already
  showing the loading bubble of the request in flight, and a wait pushed into the
  bridge would either close the collecting window before the answer is ready or
  surface on the next round trip. It does work over the WebSocket of ADR 004,
  where the flow can push whenever it wants.

## **Alternatives Considered**

| Option | Pros | Cons | Reason Not Chosen |
| --- | --- | --- | --- |
| WebSocket transport (Deep Chat supports `connect.websocket`) | Natural fit: the server pushes any number of messages at any time, no collecting window, no buffers | Needs an upgrade handler on `RED.server`, outside the ChatExpress route mechanism; `httpNodeRoot`, proxies and reconnection all become the connector's problem | The HTTP endpoint is simpler and works through any proxy, so it shipped first — and it is still the only mode that can receive file uploads. Implemented as a second connect mode in [ADR 004 – WebSocket Endpoints in ChatExpress](ADR%20004%20%E2%80%93%20WebSocket%20Endpoints%20in%20ChatExpress.md), which added `wsRoutes` to the engine |
| SSE streaming (`connect.stream`) | Server keeps pushing on a single open request | Deep Chat streams *chunks of one message*, not a sequence of distinct messages | Cannot express the multi-message model |
| Ack immediately, drop whatever the flow produces later | Trivial to implement | The flow's actual answer never reaches the user | Defeats the purpose of the connector |
| Respond as soon as the first message arrives | Lowest possible latency | Splits a multi-message answer; every message but the first slips to the next round trip | The collecting window is a better default, and it is configurable down to `0` |
| Poll from the widget for pending messages | Would deliver out-of-band messages promptly | Deep Chat has no polling mode; would need a custom `requestInterceptor` and a second endpoint, i.e. a bespoke widget | Breaks the "drop in a stock `<deep-chat>` tag" property |
