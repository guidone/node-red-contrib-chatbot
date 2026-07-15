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

## Architecture decision records (ADRs)

Architectural decisions are recorded in
[`docs/architecture/decisions/`](docs/architecture/decisions/README.md), one
file per decision, named `ADR NNN – Title.md`. Check the
[ADR index](docs/architecture/decisions/README.md) before making an
architectural change; add a new ADR when a change introduces one.

Key patterns are documented as ADRs:

- Platform integrations run on the **ChatExpress middleware engine** —
  [ADR 001](<docs/architecture/decisions/ADR 001 – ChatExpress Middleware Engine for Platform Integrations.md>).
- Platform send options (`lib/platforms/<platform>.js`) follow the **platform
  parameter registration pattern** —
  [ADR 002](<docs/architecture/decisions/ADR 002 – Platform Parameter Registration Pattern.md>).

## Documentation

Documentation for single nodes are stored in [Notion RedBot page](https://redbot.notion.site/RedBot-Documentation-1de27db692114f4db163f10e1586dc71?pvs=74) in the "RedBot" workspace.

When a node is deprecated update the documentation:

1. Add a callout block, with a question mark icon and light grey background with the text "This node is deprecated"
2. In the main page, move the link to the page of the deprecated node under the section "Deprecated nodes"

## Notes

- Recent commits removed: authorized node, msteams, nlp old nodes, twilio, alexa
- Version: 1.2.4
- ChatExpress middleware system: [ADR 001](<docs/architecture/decisions/ADR 001 – ChatExpress Middleware Engine for Platform Integrations.md>)
- Best practises (canonical helpers, conventions): [docs/best-practise.md](docs/best-practise.md)
- Per-node documentation index: [docs/nodes.md](docs/nodes.md)
