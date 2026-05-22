
The `Params node` is used to specify some platform related parameters or flag. For example in **Telegram** it’s possible to deliver a message silently while in **Twilio** it’s possible to specify the originator number (overriding the bot configuration).

The text-like values of parameters also accepts chat contexts variables. For example in **Telegram** to modify the previous sent message instead of sending a new one, just add a parameter, select platform **Telegram** then select _“Modify message”_ and then type `{{outboundMessageId}}`

![Modify message](./docs/assets/f757c4eded42e7c5.png)

The same chat context value `{{outboundMessageId}}` can be used, for example, to delete a previous message.

The same can obtained with in a upstream `Function node`:

```javascript
msg.params = [  
  { platform: 'telegram', name: 'modifyMessageId', value: '{{outboundMessageId}}'
];
return msg;
```

Available parameters for the `msg.payload`

| Name   | Type             | Description                                    |
| ------ | ---------------- | ---------------------------------------------- |
| params | array of [param] | Array of parameters to send to the Sender node |

The _param_ object

| Name     | Type   | Description                                                                                         |
| -------- | ------ | --------------------------------------------------------------------------------------------------- |
| platform | string | The specific platform (transport) this parameter is used for (_telegram_, _slack_, _facebook_, etc) |
| name     | string | The name of the parameter                                                                           |
| value    | any    | The value of the parameter                                                                          |

> ❗ The chat context `messageId` is deprecated, it was used ambiguously in previous versions to refer both the last inbound and outbound message. It’s replace by `outboundMessageId` (the id of the last message sent by the chatbot to the user) and `inboundMessageId` (the id of the last message received by the chatbot from the user).  
>For retro-compatibility `messageId` is still available. 
