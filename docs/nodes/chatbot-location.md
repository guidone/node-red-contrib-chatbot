
Send a position message to the chatbot (a tiny clicable map).

It’s possible to programmatically send a location node by passing the parameters from a upstream `Function node`:

```javascript
msg.payload.latitude = 45.00;
msg.payload.longitude = 23.00;
return msg;
```

Available parameters for the `msg.payload`

| Name      | Type   | Description              |
| --------- | ------ | ------------------------ |
| latitude  | float  | The position latitude    |
| longitude | float  | The position longitude   |
| place     | string | The position description |

Platform exceptions - **Telegram** only supports live location when using the _webHook_ connection mode and not _polling_
