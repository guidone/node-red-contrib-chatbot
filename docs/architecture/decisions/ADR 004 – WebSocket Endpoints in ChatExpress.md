# **ADR 004 – WebSocket Endpoints in ChatExpress**

**Status:** Accepted
**Date:** 2026-09-10
**Authors:** REDBot maintainers

---

## **Context**

[ADR 003 – Response Bridge for Browser Widget Platforms](ADR%20003%20%E2%80%93%20Response%20Bridge%20for%20Browser%20Widget%20Platforms.md)
connected Deep Chat over a plain HTTP endpoint and absorbed the mismatch between
a request/response widget and RedBot's asynchronous, multi-message model inside a
**response bridge**. It also recorded the price of that choice: every answer pays
the collecting window, a late message is delivered on the user's *next* message,
and out-of-band messages sit in a buffer nothing drains until the visitor comes
back. Its alternatives table named a WebSocket transport as "the likely next
step".

The obstacle was never Deep Chat — it supports `connect.websocket` — but the
engine. ChatExpress has exactly one way to accept traffic from the outside:
`routes`, mounted with `RED.httpNode.use(new RegExp(...))`. Node's HTTP server
emits `'upgrade'` on a channel that never reaches the Express router, so no route
configuration can accept a WebSocket handshake: the engine had no concept of the
raw server.

## **Decision**

Teach the engine to accept WebSocket connections with a **`wsRoutes` option**
that mirrors `routes`, and rebuild the Deep Chat connector on top of it as a
second **connect mode** (`http` — the default — or `websocket`), with a
**connection hub** taking the place of the response bridge.

```
[Deep Chat widget]  ws://…/redbot/deepchat/<botId>/ws?chatId=…
    │
    ▼
RED.server 'upgrade' ──► dispatchUpgrade()  one listener for the whole process
    │                         │ exact match on the pathname
    │                         ▼
    │                    wss.handleUpgrade() ──► Platform connection handler
    ▼
SocketHub.add(chatId, socket) ──► flush what was buffered while offline
    │
    ├── frame in  ──► Platform.receive() ──► [Inbound middleware] ──► [flow]
    │
    └── frame out ◄── SocketHub.send(chatId) ◄── [Outbound middleware] ◄── node.chat.send()
```

### The engine: `wsRoutes`

| Option | Type | Description |
| --- | --- | --- |
| `wsRoutes` | object \| `fn()` | Connection handlers keyed by path, or a function (bound to the chat server) returning them |
| `wsRoutesDescription` | object \| `fn()` | Descriptions for the startup banner, same shape |
| `wsVerifyClient` | `fn(info)` | `ws`'s `verifyClient`, bound to the chat server: refuses a handshake with a `401` |

Three properties of the implementation are worth recording, because they are
what makes it safe to share one HTTP server with Node-RED:

1. **One `'upgrade'` listener per process.** Node-RED re-creates every
   configuration node at each deploy, so a listener per chatbot would pile up.
   The listener is attached once (tracked in a `WeakSet` of servers held in the
   `global['redbot-chat-platform']` space, so it survives `ChatExpress.reset()`)
   and dispatches on a registry of `path -> { wss, chatServer }`.
2. **An unmatched request is left alone.** `new ws.Server({ server, path })`
   aborts every handshake that doesn't match its path — a single such server
   would kill the editor's own `/comms` channel and every core `websocket in`
   node. So the endpoints are `{ noServer: true }` and the dispatcher simply
   returns when the path is not in the registry, exactly like Node-RED's editor
   comms and its `22-websocket.js` node do ("Don't destroy the socket as other
   listeners may want to handle the event").
3. **Exact paths, computed per bot.** Express routes are mounted as anchored
   RegExps, which is why Deep Chat's HTTP endpoints need a wildcard segment and a
   `botId` check in each handler (ADR 003). A `wsRoutes` path is matched exactly
   and `wsRoutes` may be a function, so the bot id goes straight into the path
   (`/redbot/deepchat/<botId>/ws`) and two bots can never see each other's
   handshakes. Paths are relative to `httpNodeRoot`, which the engine applies by
   hand since an upgrade request never enters the Express router.

Symmetry with `routes` is maintained: the endpoints are mounted in `start()`
right after the Express routes, logged in the startup banner, and unmounted in
`stop()` (matched by chat server identity, which is more robust than recomputing
the paths).

### The platform: connection hub instead of response bridge

[`lib/socket-server/index.js`](../../../lib/socket-server/index.js) is the
transport-agnostic half — a `chatId -> socket` registry that any future
WebSocket platform can reuse:

* **The socket is the address of the conversation.** `.out()` middleware calls
  `hub.send(chatId, response)` the way another platform calls an API. There is no
  collecting window and no timeout: the flow pushes zero, one or many messages
  whenever it wants, which is what the widget model could not express over HTTP.
* **Buffer until reconnection.** A conversation with no live socket is buffered
  and flushed on the next handshake, so a *Push Message* to a visitor who closed
  the page still arrives. The buffer is capped (100 messages per conversation,
  oldest dropped with a warning) — unbounded growth was a recorded risk of ADR
  003 and a socket does not fix it, it only changes when the buffer drains.
* **A closing socket is not a live one.** `send()` on a socket in `CLOSING`
  silently drops the payload, so the hub checks `readyState` and buffers instead:
  without it, a flow answering in the instant between the visitor leaving and the
  server noticing loses the message.
* **Last one wins.** One socket per conversation: a second connection (another
  tab, or a reconnection the old socket never noticed) replaces the previous one,
  which is closed with `4000`. The conversation is claimed *before* the old socket
  is closed, so its `close` handler cannot evict its own replacement.
* **Heartbeat.** A ping/pong sweep (30s by default, `0` disables it) keeps the
  connection alive through reverse proxies that drop idle upgraded sockets, and
  terminates the ones that died without a close frame.

### Deep Chat over a socket

The wire format is the same in both modes — the widget sends the HTTP `Request`
body as a stringified frame, the server answers with `Response` objects — so
[`renderer.js`](../../../lib/platforms/deepchat/renderer.js) is reused verbatim
and buttons, media and location work unchanged. Two things do differ:

* **Identity.** Deep Chat does not add `additionalBodyProps` to a socket frame,
  so the widget passes `chatId` in the query string of the upgrade request. That
  is also what makes a reconnection resume the same conversation and collect what
  was buffered. The `x-redbot-chatid` header and the cookie of the HTTP endpoint
  remain as fallbacks, and both modes agree on the cookie name.
* **Uploads.** Deep Chat serializes attachments as `multipart/form-data`, which
  has no equivalent on a socket. The `POST` endpoint therefore stays mounted in
  WebSocket mode (and answers `[]`, the flow replying over the socket), and the
  test page hides the attachment button. Media *sent by the flow* works in both
  modes: it is a URL either way.
* **Origins.** CORS does not apply to WebSockets — the browser opens the socket
  whatever the origin is, with no preflight — so `allowedOrigins` is enforced by
  hand on the handshake through `wsVerifyClient`. An empty list means same origin
  only, matching the HTTP endpoint with no CORS headers.

### Where to find the implementation

| Concern | File |
| --- | --- |
| `wsRoutes` mount/unmount, upgrade dispatcher | `chat-platform/chat-platform.js` (the `chat-platform` package) |
| Connection registry, buffering, heartbeat | [`lib/socket-server/index.js`](../../../lib/socket-server/index.js) |
| Deep Chat identity, origin check, connect mode | [`lib/platforms/deepchat/index.js`](../../../lib/platforms/deepchat/index.js) |
| Test page in both modes | [`lib/platforms/deepchat/widget.js`](../../../lib/platforms/deepchat/widget.js) |
| Tests | [`__tests__/socket-hub.js`](../../../__tests__/socket-hub.js), [`__tests__/deepchat-websocket.js`](../../../__tests__/deepchat-websocket.js) |

## **Consequences**

### ✅ Positive

* Every trade-off ADR 003 recorded about latency and ordering is gone in
  WebSocket mode: no collecting window on the answer, no late message surfacing
  out of order on the *next* user message, no delivery that depends on the
  visitor sending something.
* *Push Message* becomes a real push. A flow can talk to an idle browser.
* Platforms no longer have to reach for `RED.server` themselves: accepting a
  WebSocket is now a declaration (`wsRoutes`) like accepting a webhook, with the
  same lifecycle, the same logging and the same teardown.
* The wildcard-route collision of ADR 003 does not exist for socket endpoints:
  paths are exact and per bot.
* HTTP mode is untouched and remains the default, so no existing bot changes
  behavior.

### ⚠️ Trade-offs / Risks

* **Two modes to maintain.** The response bridge is not deleted, it is bypassed:
  uploads and proxy-hostile deployments still need the HTTP endpoint, and each
  `.out()` handler now delivers through a helper that picks the live transport.
* **Attachments are HTTP only.** A WebSocket bot cannot receive files from the
  stock widget. Anything else would mean a bespoke widget, which ADR 003
  deliberately avoided.
* **`httpNodeAuth` does not apply.** An upgrade request never enters the Express
  stack, so Basic auth configured for `httpNode` does not protect the socket
  endpoint. The origin check is the only gate; a bot that relies on
  `httpNodeAuth` must not be exposed in WebSocket mode.
* **Reverse proxies need configuring.** `Upgrade` and `Connection` must be
  forwarded, or the handshake never reaches the bot — the reason ADR 003 chose
  HTTP first.
* **An upgrade to an unmounted path holds a socket.** Since the dispatcher must
  not destroy sockets it doesn't own, a handshake nobody answers stays open until
  the client gives up (verified: `server.close()` never returns and
  `closeAllConnections()` does not release it). This is Node-RED's own behavior
  for its `'upgrade'` listeners, not something introduced here, but it means an
  upgrade request is cheaper to make than to refuse.
* **Buffers are still in memory and still capped.** A flow pushing to many
  conversations that never come back grows them to the cap and then loses the
  oldest messages.
* **The dispatcher outlives the bots.** The `'upgrade'` listener is never
  removed from the server (by design, it is shared); only the registry entries
  come and go. It is inert with an empty registry.

## **Alternatives Considered**

| Option | Pros | Cons | Reason Not Chosen |
| --- | --- | --- | --- |
| Keep it in the platform: hook `RED.server` from `onStart` | No `chat-platform` release needed | Every future WebSocket platform re-implements the dispatcher, the deploy-leak guard and the teardown; nothing appears in the startup banner | Was the plan while `chat-platform` was a pinned external package; once the module was linked for development, the engine was the right home |
| `new ws.Server({ server, path })`, the obvious API | Two lines, no dispatcher | Aborts with `400` every handshake that doesn't match its own path, killing the editor `/comms` channel and every core `websocket in` node | Actively breaks the host |
| One `'upgrade'` listener per chat server | Simpler bookkeeping, no shared registry | Node-RED re-creates configuration nodes at every deploy: listeners pile up and trip the max-listeners warning | The shared dispatcher is the pattern Node-RED itself uses |
| Replace the HTTP mode entirely | One code path, no `connectMode` | Loses file uploads, and a socket cannot be assumed to survive every proxy | The two modes answer different deployments |
| Deliver over whichever transport is available (socket if connected, else the open request) | Never a wrong choice for the flow author | Which one gets a given message becomes ambiguous, and so does the ordering between them | One rule per mode is easier to reason about and to support |
| Fan out to every socket of a conversation | Several tabs stay in sync | Duplicated context updates and no way to tell which tab a postback came from | Last-one-wins matches how the widget stores its `chatId` |
