
The `Video node` sends a video to the chatbot from a local file or from a URL or from a Buffer passed by an upstream node (the simplest way to use it to chain with to `File node` or a `Http node`).

Some file types are not supported by a specific platform, for example _Telegram_ and _Facebook Messenger_ only supports _.mp4_. Different video format che be sent with the `Document node`.

To programmatically send a video, in the upstream `Function node`

```javascript
msg.video = '/my/local/my-video.mp4';
return msg;
```

Or using a `Buffer`:

```javascript
msg.payload.document = new Buffer(<my-video-buffer>);
msg.payload.filename = 'my-video.mp3';
return msg;
```

In case the upstream node pass through a `Buffer`, the node tries to extract a proper file name (visible to user in the chat client) using the payload of the upstream `File node` or the name of the node itself.

| Name    | Type             | Description                                                                                |
| ------- | ---------------- | ------------------------------------------------------------------------------------------ |
| video   | string or buffer | The video string could be a path for a local file or a URL (context variables can be used) |
| caption | string           | Caption of the video. Only for Telegram, Slack and Viber                                   |
