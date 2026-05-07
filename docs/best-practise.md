# Best Practises

Conventions to follow when adding or modifying nodes in this project.

## Extracting the chatId from a `msg`

Always use the `getChatId` helper from `lib/helpers/utils.js`. It is the canonical extractor used across the codebase (see `nodes/chatbot-message.js`).

```js
const { getChatId } = require('../lib/helpers/utils');

// inside the input handler
const chatId = getChatId(msg);
```

`getChatId` looks up the chatId in this order:

1. `msg.originalMessage.chatId` — set by the platform receiver (Telegram, Slack, Facebook).
2. `msg.payload.chatId` — fallback used when the chat id is carried in the payload (e.g. messages forged by user-built flows).
3. Returns `null` if neither is present.

Do **not** read `msg.originalMessage?.chatId` directly: it skips the payload fallback and silently breaks for any flow that doesn't go through a platform receiver.

The same module exposes sibling extractors that should be preferred over hand-rolled lookups: `getMessageId`, `getUserId`, `getTransport`, `getChatContext`.
