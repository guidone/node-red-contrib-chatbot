# Best Practises

Conventions to follow when adding or modifying nodes in this project.

## Validating an incoming `msg`

Always use the `isValidMessage` helper from `lib/helpers/utils.js` as the first check inside a node's `input` handler. It is the canonical guard used across the codebase (see `nodes/chatbot-message.js`, `nodes/chatbot-document.js`, `nodes/chatbot-audio.js`, etc.).

```js
const { isValidMessage } = require('../lib/helpers/utils');

// inside the input handler, before any other work
if (!isValidMessage(msg, node)) {
  return;
}
```

`isValidMessage` returns `true` only when `msg.originalMessage.transport` is set — i.e. the message was originated by a RedBot receiver (Telegram Receive, Facebook Receiver, Slack Receiver, …) or a Conversation node. When it returns `false` it also prints a self-explanatory warning to the console pointing the user at the Conversation-node docs, so the early `return` is enough — do **not** call `done()` or `node.error()` here.

Pass `{ silent: true }` as the third argument when the node should accept arbitrary inputs and only opt into RedBot-aware behavior (see `nodes/mc-graphql.js`):

```js
if (isValidMessage(msg, null, { silent: true })) {
  // RedBot-aware branch
}
```

Do **not** hand-roll checks on `msg.originalMessage` or `msg.payload.chatId`: they bypass the standard warning and drift from the rest of the codebase.

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

## Working with dates

Use `dayjs` for all date handling. Moment was removed from the codebase — do not reintroduce it.

```js
const dayjs = require('dayjs');

dayjs().toISOString();                  // current time as ISO string
dayjs.unix(payload.timestamp).toISOString(); // platform unix seconds → ISO string
dayjs(value).format('DD MMM HH:mm:ss');
dayjs.isDayjs(value);                   // type check (replaces moment.isMoment)
```

Store timestamps as **ISO 8601 strings** in chat context, GraphQL inputs, Redux state, and the `ts` field on messages from any platform receiver. Do not pass dayjs (or any other date library) objects across module boundaries — keep dayjs instances local to the function that needs them.
