# node-red-contrib-chatbot (REDBot)

Visual chatbot builder for Node-RED. Supports Telegram, Facebook Messenger, Slack.

## Architecture

- **nodes/** — 109 Node-RED node definitions (.js logic + .html UI)
- **lib/** — Platform integrations (Telegram, FB, Slack), helpers, auth, caching
- **core/** — Core modules: config, context, messages, simulator, plugins, users
- **database/** — SQLite via Sequelize + GraphQL (Apollo) layer
- **src/** — React 16 frontend (Mission Control dashboard), built with webpack
- **__tests__/** — Jest test suite (37 files)

## Common Commands

```bash
npm test          # Run Jest tests
npm run build     # Production webpack build
npm run dev       # Dev mode with hot reload
npm run lint      # ESLint
npm start         # Start Node-RED
```

## Tech Stack

- **Runtime:** Node.js, Node-RED >= 2.0
- **Chat:** node-telegram-bot-api, @slack/bolt
- **DB:** SQLite via Sequelize, GraphQL via Apollo
- **Frontend:** React 16, RSuite UI, webpack 5
- **Testing:** Jest 27, chai, chai-spies

## Node-RED Node Structure

Each node lives in `nodes/<name>/` with:
- `index.js` — node logic registered with Node-RED
- `index.html` — editor UI definition

## Platform Parameters (lib/platforms/<platform>.js)

Each platform (e.g. `telegram.js`, `facebook.js`) exposes platform-specific send options as **params**. The pattern:

1. **Read a param** inside an `out` handler: `const param = params(message);` then `param('camelCaseName', defaultValue)`.
2. **Pass to API**: map camelCase param names to snake_case API fields (e.g. `allowPaidBroadcast` → `allow_paid_broadcast: param('allowPaidBroadcast', false)`).
3. **Register** at the bottom of the file so the UI (Mission Control) can expose it as a node option:
   ```js
   Telegram.registerParam('camelCaseName', 'boolean'|'string'|'select', {
     label: 'Human label',
     default: false,
     description: 'Shown in UI',
     // for 'select': options: [{ value, label }, ...]
     // for 'string': placeholder, suggestions: ['{{token}}', ...]
   });
   ```
   Registered params appear as configurable fields on nodes in the Node-RED editor.

## ChatExpress Middlewares (lib/platforms/<platform>.js)

Platforms register middlewares via `Platform.in(fn)` (inbound) and `Platform.out(fn)` (outbound):

- **`.in(fn)`** — runs on every incoming message before it reaches the Node-RED flow. Used to enrich the message context (e.g. storing `firstName`, `lastName`, `username` from the raw API payload into the chat context, downloading media files).
- **`.out(fn)`** — runs on every outgoing message before it is sent to the platform API. Used to map Node-RED message fields to platform-specific API parameters.
- Each middleware receives the `message` object and must return it (or a Promise resolving to it) to continue the chain.
- `this.getOptions()` inside a middleware gives access to the bot configuration options (token, connector settings, etc.).
- `message.chat()` returns the chat context store for the conversation; use `context.get(...)` / `context.set(...)` to persist per-user state across messages.
- **`authorizedUsernames` is deprecated** — authorization is no longer handled inside platform middlewares; the `.in()` middleware in `telegram.js` no longer sets `vars.authorized` based on that option.

## Notes

- Recent commits removed: authorized node, msteams, nlp old nodes, twilio, viber, alexa
- Version: 1.2.4
