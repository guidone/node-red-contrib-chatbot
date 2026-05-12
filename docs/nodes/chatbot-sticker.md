
The `Sticker node` allows to send a sticker to a **Telegram** client.

A sticker can be a image file (only __.webp_ format is allowed) or the id of an already loaded image on_ Telegram*’s server.

In order to get the id of a sticker, use [GetStickerIdBot](https://telegram.me/GetStickerIdBot)

To use this node programmatically, just connect the input to the output of a `File node` or send the file name or URL from a upstream `Function node`

```javascript
msg.payload = '/my_dir/my_file.webp'
```

or

```plain text
msg.payload = {
  sticker: 'http://www.my_host.com/my_dir/my_file.webp'
}
```

Available parameters for the `msg.payload`

| Name    | Type             | Description                                                                    |
| ------- | ---------------- | ------------------------------------------------------------------------------ |
| sticker | string or buffer | The sticker string could be the sticker id, the path for a local file or a URL |
