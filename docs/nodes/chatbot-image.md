
The `Image node` sends an image to the chatbot from a local file or from a URL or from a Buffer passed by an upstream node (the simplest way to use it to chain with to `File node` or a `Http node`).

To programmatically send an image with a `Function node`

```javascript
msg.payload = '/my_dir/my_image.png';
```

or

```javascript
msg.payload = {
  caption: 'I am the caption',
  image: 'http://www.my_host.com/my_dir/my_image.png'
};
```

Available parameters for the `msg.payload`

| Name    | Type             | Description                                                                                |
| ------- | ---------------- | ------------------------------------------------------------------------------------------ |
| image   | string or buffer | The image string could be a path for a local file or a URL (context variables can be used) |
| caption | string           | Caption of the image. Only for Telegram, Slack and Viber                                   |

An example of fetching an image with a `Http node`

![](./docs/assets/5d17a173759b844e.png)

Pay attention to select to select _binary buffer_ in the _return_ drop down of the `File node`.

**Viber** only accepts _.jpg_ images less than 1 Mb.
