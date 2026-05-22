
The `Audio node` sends an audio to the chatbot from a local file or from a URL or from a Buffer passed by an upstream node (the simplest way to use it to chain with to `File node` or a `Http node`).

To programmatically send an audio with a `Function node`

```javascript
msg.payload.document = '/my-file.mp3';return msg;
```

Or using a `Buffer`

```javascript
msg.payload.document = new Buffer(<my-mp3-buffer>);msg.payload.filename = 'my-file.pdf';return msg;
```

In case the upstream node pass through a `Buffer`, the node tries to extract a proper file name (visible to user in the chat client) using the payload of the upstream `File node` or the name of the node itself.

Available parameters for the `msg.payload`

| Name    | Type             | Description                                                                                |
| ------- | ---------------- | ------------------------------------------------------------------------------------------ |
| audio   | string or buffer | The audio string could be a path for a local file or a URL (context variables can be used) |
| caption | string           | Caption of the audio. Only for Telegram, Slack and Viber                                   |
