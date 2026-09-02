
Used to send a plain text message to the chatbot’s user, a handlebars-like syntax can be used to insert values from the chat context, for example:

```plain text
Hi {{firstName}}, your check is {{total}} euros
```

Some chat context keys are automatically populated (like `{{firstName}}`, `{{lastName}}`, `{{language}}`, etc - if the platform provides them) , other keys are system specific and are read-only (like `{{userId}}`, `{{chatId}}` and `{{transport}}`), some other keys depends on the current flow, like `{{payload}}`, for example if the upstream node sends a payload like

```javascript
{  
  total: 42,  
	shipping: {    
		address: 'Nowhere street,    
		city: 'Milan'  
	}
}
```

can be used in the text message in this way

```plain text
Your order of {{payload.total}} will be shipped to {{payload.shipping.address}}, {{payload.shipping.city}}
```

For more information read the [Chat Context](https://app.notion.com/p/3460c588cf234344974936acd05f8c16) .

It’s possible to specify more content versions for the same message, one will we randomly chosen with an even distribution.

If a _language_ is specified in the drop down menu, then the message will be added only if the specified language matches the one in the chat context. Most of the platforms provide the user language, this value is stored in the chat context when the user starts a conversation. In order to support multiple languages in a chatbot, just chain different `Message node` with different languages, the ones that don’t match the user language will be skipped.

![Multi language support](./docs/assets/a7c8cb6d9812bcab.png)

The text message can be passed through the payload by the upstream node:

```javascript
msg.message = 'I am a message';
return msg;
```

or for multiple versions of the message

```javascript
msg.message = [
  'First version of the message',
  'Second version of the message'
];
return msg;
```


Check the [Params node](https://app.notion.com/p/d8b27db3949c475184923af913563833) for extra parameters and options related to message sending (i.e. the [_RichMessage_](https://core.telegram.org/bots/api#rich-messages) support for Telegram).

Available parameters for the `msg.payload`

| Name     | Type                       | Description                                                                                                                                                                          |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| message  | string / array of [string] | String or array of strings to send. If array, a random one will be chosen                                                                                                            |
| language | string                     | Language of the message                                                                                                                                                              |
| fallback | string                     | Fallback message to use in case of a message broadcast containing tokens like {{first_name}} or {{last_name}} and the bot doesn’t have privileges to access profile info. _Facebook_ |
