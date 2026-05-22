
The `Document node` sends a document to the chatbot from a local file or from a URL or from a Buffer passed by an upstream node (the simplest way to use it to chain with to `File node` or a `Http node`).

Some file types are not supported by a specific platform, for example _Telegram_ only supports _.zip_, _.pdf_, _.gif_. If a file not supported is automatically compressed and converted in a ZIP file.

To programmatically send a document, in the upstream `Function node`

```javascript
msg.payload.document = '/my-file.pdf';
return msg;
```

Or using a `Buffer`:

```javascript
msg.payload.document = new Buffer(<my-buffer>);
msg.payload.filename = 'my-file-name.pdf';
return msg;
```

In case the upstream node pass through a `Buffer`, the node tries to extract a proper file name (visible to user in the chat client) using the payload of the upstream `File node` or the name of the node itself.

Available parameters for the `msg.payload`

| Name     | Type             | Description                                                                                   |
| -------- | ---------------- | --------------------------------------------------------------------------------------------- |
| document | string or buffer | The document string could be a path for a local file or a URL (context variables can be used) |
| caption  | string           | Caption of the document. Only for Telegram, Slack and Viber                                   |
