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

## Notes

- Recent commits removed: authorized node, msteams, nlp old nodes, twilio, viber, alexa
- Version: 1.2.4
