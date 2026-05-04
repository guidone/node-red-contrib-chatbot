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

## Documentation

Documentation for single nodes are stored in [Notion RedBot page](https://redbot.notion.site/RedBot-Documentation-1de27db692114f4db163f10e1586dc71?pvs=74) in the "RedBot" workspace.

When a node is deprecated update the documentation:

1. Add a callout block, with a question mark icon and light grey background with the text "This node is deprecated"
2. In the main page, move the link to the page of the deprecated node under the section "Deprecated nodes"

## Notes

- Recent commits removed: authorized node, msteams, nlp old nodes, twilio, alexa
- Version: 1.2.4
- ChatExpress middleware system: [docs/chatexpress.md](docs/chatexpress.md)
