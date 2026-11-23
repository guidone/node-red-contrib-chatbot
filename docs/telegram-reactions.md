# Telegram reaction events

The Telegram Receiver sends reaction updates to its **second (event) output** in both polling and webhook modes. The bot must be an administrator in the chat to receive these updates. RedBot explicitly subscribes to `message_reaction` and `message_reaction_count` alongside ordinary Telegram updates when it starts polling or sets its webhook; redeploy the bot after upgrading to refresh an existing webhook subscription.

An individual `message_reaction` update produces `payload.type = "event"` and `payload.eventType = "reaction"`. Its fields include `chatId`, `messageId` (the message reacted to), `oldReaction` and `newReaction` (Telegram reaction arrays), and `actor` when Telegram supplies a user or `actorChat` when it supplies an anonymous chat. Compare the old and new arrays to distinguish adding, removing, or changing a reaction; neither field is reduced to a single emoji.

An aggregate `message_reaction_count` update produces `payload.type = "event"`, `payload.eventType = "reaction-count"`, `chatId`, `messageId`, and `reactions` (Telegram's array of reaction types and totals). Counts can be delayed and do **not** identify individual reactors. Do not treat the transport's context `userId` on an anonymous event as the reactor's identity; inspect `actor` or `actorChat` for an individual change. The raw Telegram update is also available as `originalMessage`.

Telegram does not send reaction updates for reactions set by the bot itself.
