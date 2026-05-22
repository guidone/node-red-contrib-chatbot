
The `Animation node` sends an animated GIF or video to the chatbot from a local file or from a URL or from a Buffer passed by an upstream node (the simplest way to use it to chain with to `File node` or a `Http node`).

To programmatically send an animation with a `Function node`

```javascript
msg.payload = '/my_dir/my_image.gif';
```

or

```javascript
msg.payload = {
  caption: 'I am the caption',
  image: 'http://www.my_host.com/my_dir/my_image.gif'
};
```

Available parameters for the `msg.payload`

| Name      | Type             | Description                                                                                |
| --------- | ---------------- | ------------------------------------------------------------------------------------------ |
| animation | string or buffer | The image string could be a path for a local file or a URL (context variables can be used) |
| caption   | string           | Caption of the image. Only for Telegram, Slack and Viber                                   |
