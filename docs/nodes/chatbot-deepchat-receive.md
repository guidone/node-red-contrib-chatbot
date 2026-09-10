
[Deep Chat](https://deepchat.dev/) is a open source web component that drops a chat widget into any web page. The **Deep Chat** connector turns a **RedBot** flow into the backend of that widget.

Unlike every other platform in RedBot, there is **nothing to sign up for**: no external service, no web-hook to register with a third party, no access token, no public HTTPS address. The widget talks straight to Node-RED. That makes it the fastest way to get a working chatbot — and the only platform you can develop entirely offline.

## **1. What you need**

That's it. You can skip ngrok, tunnels and certificates — they are needed by the web-hook platforms (WhatsApp, Facebook, Telegram web-hook mode), not by this one.

## **2. Drop the nodes in a flow**

Three nodes, wired left to right:

```plain text
[Deep Chat Receiver] → [Message] → [Deep Chat Sender]
```

- **Deep Chat Receiver** — the inbound node, has no input and one output. Every message a visitor types enters the flow here.

- **Message** — any RedBot node producing an answer. Start with a plain text message.

- **Deep Chat Sender** — the outbound node, sends whatever reaches it back to the widget.

All three are in the **RedBot Platforms** palette category.

## **3. Create the bot configuration**

Double-click the **Deep Chat Receiver** node, then click the pencil next to _Bot configuration (development)_ to create a new configuration node.

**The only field you must fill in**

| **Field**  | **Value**                                  |
| ---------- | ------------------------------------------ |
| **Bot ID** | a slug identifying this bot, e.g. `my-bot` |

The **Bot ID** becomes part of every endpoint the connector mounts, so it must be unique across the Node-RED instance and URL-safe (letters, digits, dashes).

**Everything else, and when to touch it**

| **Field**                                                                        | **Default**                | **What it does**                                                                                                                                                              |
| -------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Bot Name**                                                                     | —                          | label shown in the Node-RED editor and the startup banner                                                                                                                     |
| **Connect mode**                                                                 | `http`                     | `http` (request/response) or `websocket` (the server pushes at any time) — see [§6](https://claude.ai/epitaxy/local_ab742e55-e3e8-44a9-9753-8564eb2646a2#6-http-or-websocket) |
| **Intro message**                                                                | —                          | first bubble the widget shows before the visitor types anything (client side only, the flow never sees it)                                                                    |
| **Accept files**                                                                 | on                         | let the visitor attach files (HTTP mode only)                                                                                                                                 |
| **Heartbeat**                                                                    | `30000`                    | ms between ping/pong sweeps on a socket, `0` disables — WebSocket mode only                                                                                                   |
| **Timeout**                                                                      | `20000`                    | ms an inbound request is held open waiting for the flow — HTTP mode only                                                                                                      |
| **Collect window**                                                               | `400`                      | ms to wait for further flow messages after the last one — HTTP mode only                                                                                                      |
| **Public URL**                                                                   | —                          | absolute base of your Node-RED, needed so media links work when the widget lives on another host                                                                              |
| **Allowed origins**                                                              | —                          | comma-separated origins allowed to talk to the bot; empty means same origin only                                                                                              |
| **Deep Chat bundle**                                                             | jsDelivr `deep-chat@2.5.1` | override to self-host the widget script                                                                                                                                       |
| **Context**                                                                      | —                          | context provider for the conversation (as in every other platform)                                                                                                            |
| **Debug**                                                                        | off                        | log inbound/outbound messages                                                                                                                                                 |
| **Store messages** / **Inspect messages** / **Mission Control** / **Chatbot ID** | —                          | standard RedBot/Mission Control options, identical to the other platforms                                                                                                     |

Deploy. The startup banner in the Node-RED log lists the endpoints the bot mounted.

## **4. Try it: the built-in test page**

Open in a browser:

```plain text
http://localhost:1880/redbot/deepchat/<botId>/widget
```

This is a ready-made page with a widget already wired to the bot **in the mode it is configured with**. Type something and the flow answers.

The page also hands out the markup to embed the same widget anywhere, in two variants:

- **inline** — the widget sits wherever the tag is placed;

- **floating** — a round launcher pinned to the bottom-right corner that opens a 350px chat panel (closed by default, reopened on the next page load if the visitor left it open).

Each variant can be copied to the clipboard or opened directly in a CodePen.

> A CodePen pen runs on `https://cdpn.io`, so for the CodePen buttons to work the bot needs a reachable **Public URL** and `https://cdpn.io` listed in **Allowed origins**.

---

## **5. Embed the widget in your own page**

### **HTTP mode**

```plain text
<script type="module" src="https://cdn.jsdelivr.net/npm/deep-chat@2.5.1/dist/deepChat.bundle.js"></script>
<deep-chat id="chat"></deep-chat>
<script type="module">
  const chat= document.getElementById('chat');
  chat.connect= {
    url: 'https://mybot.example.com/redbot/deepchat/my-bot',
    method: 'POST',
    additionalBodyProps: { chatId: 'a-stable-id', userId: 'a-stable-id' }
  };
  chat.requestBodyLimits= { maxMessages: 1 };
</script>
```

### **WebSocket mode**

Deep Chat does not add `additionalBodyProps` to a socket frame, so the conversation is identified by the **query string of the upgrade request**:

```plain text
<script type="module">
  const chatId= 'a-stable-id';
  chat.connect= {
    url: 'wss://mybot.example.com/redbot/deepchat/my-bot/ws?chatId=' + chatId+ '&userId=' + chatId,
    websocket: true
  };
</script>
```

### **About** **`chatId`**

`chatId` identifies the conversation and **must be stable for the same visitor** — generate it once and keep it in `localStorage`, the way the test page does. If you omit it, the connector falls back to the `x-redbot-chatid` header and then to a cookie it sets itself (`redbot-deepchat-<botId>`), so a bare `<deep-chat>` tag still gets a stable conversation instead of a new one per message. Both transports agree on the cookie name, so a visitor switching mode keeps the same conversation.

`userId` defaults to the `chatId` when not sent.

### **Cross-origin**

If the page is served by a different host than Node-RED:

1. list its origin in **Allowed origins**;

2. set **Public URL** so media links are absolute.

CORS does not apply to WebSockets — the browser opens the socket whatever the origin is, with no preflight — so in WebSocket mode the same list is enforced by hand on the handshake, and a connection from a disallowed origin is refused with a `401`.

## **6. HTTP or WebSocket?**

Both modes speak the same wire format and support the same message types. Pick with this table:

|                                     | **HTTP (default)**                                            | **WebSocket**                                                          |
| ----------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Transport                           | one `POST` per message, response held open                    | persistent socket                                                      |
| Latency                             | pays the collect window (400ms) on every answer               | none                                                                   |
| Multi-message answers               | gathered into one response                                    | pushed one by one, as the flow produces them                           |
| **Push Message** to an idle visitor | buffered, delivered on the visitor's _next_ message           | delivered immediately                                                  |
| Late answer (after the timeout)     | surfaces on the visitor's next message, possibly out of order | not applicable                                                         |
| **Waiting** node                    | no-op (the widget is already showing its own loading bubble)  | works                                                                  |
| File uploads from the visitor       | ✅                                                             | ❌ (hidden in the widget)                                               |
| Media sent by the flow              | ✅                                                             | ✅                                                                      |
| Reverse proxy                       | works through anything                                        | must forward `Upgrade` and `Connection`                                |
| `httpNodeAuth`                      | applies                                                       | **does not apply** — an upgrade request never enters the Express stack |

Rules of thumb:

- **Start with HTTP.** It is the default, it works through every proxy, and it is the only mode that can receive attachments.

- **Switch to WebSocket** when the flow needs to talk to the visitor unprompted (_Push Message_, a _Waiting_ indicator, a long-running job reporting progress), and you control the proxy in front of Node-RED.

- **Do not expose a WebSocket bot that relies on** **`httpNodeAuth`** — the origin check is the only gate on that endpoint.

The mechanics behind both modes are recorded in ADR 003 – Response Bridge for Browser Widget Platforms and ADR 004 – WebSocket Endpoints in ChatExpress.

## **7. Endpoints**

Every bot configuration mounts these, all prefixed by `httpNodeRoot` if you set one:

| **Endpoint**                              | **Mode**   | **Purpose**                                                                                                                                                                |
| ----------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /redbot/deepchat/<botId>`           | both       | the endpoint the widget posts to. Stays mounted in WebSocket mode (it is the only way to upload a file) but answers with an empty array — the flow replies over the socket |
| `GET /redbot/deepchat/<botId>/ws`         | web-socket | the socket endpoint                                                                                                                                                        |
| `GET /redbot/deepchat/<botId>/widget`     | both       | the test page of [§4](https://claude.ai/epitaxy/local_ab742e55-e3e8-44a9-9753-8564eb2646a2#4-try-it-the-built-in-test-page)                                                |
| `GET /redbot/deepchat/<botId>/files/<id>` | both       | media produced by the flow, **expires after one hour**                                                                                                                     |

---

## **8. What the flow can send**

| **RedBot node**                               | **Rendered as**                                                                        |
| --------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Message**                                   | plain text bubble                                                                      |
| **Inline Buttons** / **Quick Replies**        | Deep Chat suggestion buttons                                                           |
| **Photo**, **Video**, **Audio**, **Document** | media, served from the bot's files endpoint                                            |
| **Location**                                  | a link to OpenStreetMap                                                                |
| **Waiting**                                   | a temporary message the widget drops when the answer arrives — **WebSocket mode only** |

### **Buttons keep their post-back semantics**

Deep Chat's suggestion buttons submit the button's **text content** as an ordinary user message — there is no payload channel like Telegram's `callback_data`. The connector works around it: it remembers the buttons it just sent, and translates a text matching a button label back into that button's **value** before the flow sees it.

So you author button flows exactly as on any other platform: match on the `value`, not on the label.

## **9. What the visitor can send**

- **Text** — arrives as a normal `message`.

- **Attachments** — forwarded to the flow as `photo`, `audio`, `video` or `document` messages, up to **20MB**, with the text typed alongside them becoming the `caption` of the first file. The payload content is the file **buffer**, as in every other platform.

Attachments are **HTTP mode only**: Deep Chat uploads files as `multipart/form-data`, which has no equivalent on a socket, so the attachment button is hidden in WebSocket mode. Set **Accept files** off to refuse uploads entirely (the endpoint then answers `415`).

## **10. Development vs production**

`Deep Chat Receiver` and `Deep Chat Sender` carry a double bot configuration, _development_ and _production_, like the other platform nodes. The _development_ one is used by default; to switch, set the `environment` global variable to `"production"` in `settings.js`.

A practical split: development points at `http://localhost:1880` with no **Public URL** and no **Allowed origins**; production carries the real **Public URL**, the origins of the pages that embed the widget, and possibly `websocket` as the connect mode.

## **11. Troubleshooting**

| **Symptom**                                  | **Cause**                                                                                                               |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Widget shows an error, nothing in the flow   | wrong **Bot ID** in the URL, or the flow is not deployed                                                                |
| `503 Chatbot is not running`                 | the request landed while the bot was shutting down — redeploy                                                           |
| `405`                                        | the widget is doing a `GET`; the message endpoint is `POST` only                                                        |
| `415`                                        | **Accept files** is off and the widget tried to upload                                                                  |
| `400 Empty message`                          | neither text nor files in the request                                                                                   |
| Answers arrive one message late              | HTTP mode, and the flow answered after the **Timeout** — raise it, or switch to WebSocket                               |
| Every answer feels sluggish                  | the **Collect window** (400ms); lower it, down to `0`, if the flow only ever sends one message                          |
| Browser blocks the request                   | the page's origin is not in **Allowed origins**                                                                         |
| Images/documents 404                         | they expired (one hour), or **Public URL** is missing on a cross-host page                                              |
| Socket never connects                        | a reverse proxy is not forwarding `Upgrade`/`Connection`, or the origin is not allowed (`401`)                          |
| Two bots answering the same message          | two configurations share the same **Bot ID** — the HTTP endpoints are wildcard routes, only the Bot ID keeps them apart |
| Every visitor lands in the same conversation | the embedding page sends a constant `chatId` — generate one per visitor and store it                                    |
| A **Waiting** node does nothing              | expected in HTTP mode                                                                                                   |

## **12. Known limits**

- **Buffers live in memory.** Messages for a conversation with nobody listening are kept per conversation (capped at 100 in WebSocket mode, uncapped in HTTP mode) and only drained when the visitor comes back.

- **One socket per conversation.** A second connection — another tab, or a reconnection the old socket never noticed — replaces the previous one, which is closed with code `4000`. Several tabs do not stay in sync.

- **No delivery acknowledgement.** If the browser navigates away mid-request in HTTP mode, the response is dropped and — unlike an out-of-band message — not buffered.
