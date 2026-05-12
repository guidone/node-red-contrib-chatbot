
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

For more information read the [Chat Context](https://www.notion.so/3460c588cf234344974936acd05f8c16) .

It’s possible to specify more content versions for the same message, one will we randomly chosen with an even distribution.

If a _language_ is specified in the drop down menu, then the message will be added only if the specified language matches the one in the chat context. Most of the platforms provide the user language, this value is stored in the chat context when the user starts a conversation. In order to support multiple languages in a chatbot, just chain different `Message node` with different languages, the ones that don’t match the user language will be skipped.

![Multi language support](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/d034c90d-edf2-4d69-ad7f-f7d9457cf424/example-language.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4667SJBPLDC%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T122936Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJGMEQCIEZkFDmJWQMegFmOxYTFMySgqhMochSoTKU7lDMNxDbQAiA095YXNh8SxtFLfoFfi4rsLgxyV3WpxR7wn9BVEt%2FLWSr%2FAwgsEAAaDDYzNzQyMzE4MzgwNSIMQMDTsZhKAjDYJBjEKtwDbjdQs2DXmksChSZ4LFln1OxKP7ryE7jDuID5WPJSVezCESgQik7cSzP5kb2XGEwypOXIEH3ZULNe6Tne6OqCabnI%2Fdc64YU0gHP8hL2js9BGqUbvc%2B%2BYmngzzNE%2Fq8gKeBWHeh2iVl%2BzzckRWXDoHgV55nPIpFI4pbF4KUXkuAB2sqADlR0LqI1VFIw2jE8P21iL%2F7PbHetvqib8hoxgtw3sZ2XJVbUedcgBciueVBx4wCaIMFjyMl1exFEf8QMkn5K%2BYodbjsGv%2Fc8bqQh5NCeC2jrL8iwa9%2Ft0m8e7Y7Aq8j99%2FPAWBzSTsED4OYuBNGp6CDYFAv4H%2FWUTkP2NqdgPZd7KVaPEr1ihNWfdyQ0jMzXSEReo9EOTiX0ylP13fW6Jphspm21O9C5t5UPpSf4tOX6YpdMkVLAWfYRKF%2FMrTQTksXnUCm0%2BDd5DCCKtg9mHhROdVyKcydzquXHS%2FTEiLu66HlbO2vr8U8yQhD2o5EUj0K%2FveLjgpttR6ksEd3%2Fr3mGqmfRiUilyftuuvOgIl6LfFMp61kt%2BgQYrnrFylPrPI327fIBPvZnVQKgFZbc77I5WkkbzDbs9UCu%2BySwvnQPlHcSkXjT8wESwxt4lD3sKUfyUVPNj8PQwzp2M0AY6pgGTiBEMdKDtdGXbDooD2TRCkfXb54MyFLRLczLonxNxX9oPdnLJent6shom95JxcF8PZb4JyI%2B%2Bi8X%2BdAKNVjf2LHthr5PyJ3OCSwk4MqAD32MSJPUYEMg%2BvizYvou08LUDQgEDp3Qj%2FAxCYS5uKS1fesjdxGW97RLF4fkjTHV%2BwJrso7SyhaHwylkFsfABsqYsVFqJbukJAXOfrVcZKDL9MmgzCo2T&X-Amz-Signature=d43f1b16808f9a964df4d60568b97153a3cd98dfac3a2509b3969efc02ad6b30&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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

Available parameters for the `msg.payload`

| Name     | Type                       | Description                                                                                                                                                                          |
| -------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| message  | string / array of [string] | String or array of strings to send. If array, a random one will be chosen                                                                                                            |
| language | string                     | Language of the message                                                                                                                                                              |
| fallback | string                     | Fallback message to use in case of a message broadcast containing tokens like {{first_name}} or {{last_name}} and the bot doesn’t have privileges to access profile info. _Facebook_ |
