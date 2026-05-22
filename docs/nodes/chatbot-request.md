
Trigger a special request button in _Facebook Messenger_ or _Telegram_ client, like current position or phone number (only for _Telegram_).

With _Facebook Messenger_ it’s also possible to use [Quick Replies node](https://www.notion.so/200e9ae1a1fd459baa29c76d6a4025e2)  to ask the current position of the user.

The parameters for the `Request node` can be defined in a upstream `Function node`, for example

```javascript
msg.payload = {
  message: 'Please tell me where you are',
  requestType: 'location',
  buttonLabel: 'Your position'
};
return msg;
```

Available parameters for the `msg.payload`

| Name        | Type   | Description                                          |
| ----------- | ------ | ---------------------------------------------------- |
| message     | string | The message text above the request button            |
| requestType | string | Type of request. Can be _location_ or _phone-number_ |
| buttonLabel | string | Button label (only for _Telegram_)                   |
