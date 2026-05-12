
**Whatsapp** Message templates are used to initiate conversations with customers. Unlike other types of messages, message templates are the only type of message that can be sent to customers who have yet to initiate a conversation with you, or who have not sent you a message in an existing conversation thread within the last 24 hours.

Message templates must be approved before you can send them to customers. In addition, templates may be disabled automatically based on customer feedback. Once disabled, a message template cannot be sent to customers again until its quality rating has improved or it no longer violates Facebook [business](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.whatsapp.com%2Flegal%2Fbusiness-policy%2F%3Ffbclid%3DIwAR0mEqGfaYvRxsP1fKntp2sx2dFpqAukYe2clzYMtlhmpufrEl_9LEWBR04&h=AT0Z0AugObraxIqwT8PoV76tFyyhht-wFGonPGE0q151h9nY1HlUmTG1u1Q_Rb8nP5Wa1afsTAkp92uISpJEkuxYPq5D-bhj5g4pep7YuhaNyeapfyrgidlWMtTsH8enaGs_zG5h) or [commerce](https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.whatsapp.com%2Flegal%2Fcommerce-policy%2F%3Ffbclid%3DIwAR16tUOGOhWwDQK8BPEZhsv8ZX-SJUP61d--YrwTDIWWAN5i76PLpC2c4B4&h=AT0CzvI2HKF0tl7Z-jagZ_1hS38V40BDtjIjFQjLVdMgLycSiGQ_EzDFrslDfBbTfYcee5uLeOmoKkVONwG3vVoIniKNAIK5Cq4CtRBzanzHEhFZjkW2aQj5BWF0K7fneYUZ7Ca0) policies.

Enter the templates page from the _Whatsapp_ → _Quickstart_ section (pay attention you’re editing the templates for the right Account ID in the top right drop-down). 

Add params in header and body section, should match the number or params of the template, otherwise you’ll get a `WhatsAPI error: (#132000) Number of parameters does not match the expected number of params`. 

You can use string interpolation in any input box, using chat context variables or payload variables (i.e., `{{myContextVariable}}`, `{{payload.aVariableInPayload}}` or `{{msg.anotherVariableInInputMessage}}`. 

In order to use a Whatsapp template in a upstream `Function node`

```javascript
return {
  ...msg,
  payload: {
    template: 'hello_world',
    language: 'en_US',
    paramsBody: [
      {
        type: 'text',
        text: 'Some text'
      }
    ]
  }
};
```

Available parameters for the `msg.payload`

| Name         | Type                  | Description                                          |
| ------------ | --------------------- | ---------------------------------------------------- |
| template     | string                | A template name (from the Whatsapp template manager) |
| language     | string                | The template language (i.e., `en` or `en_US`)        |
| paramsBody   | [waTemplateParameter] | Template parameters for the body                     |
| paramsHeader | [waTemplateParameter] | Template parameters for the header                   |

The `[waTemplateParameter]` object

| Name      | Type                 | Description                                                                               |
| --------- | -------------------- | ----------------------------------------------------------------------------------------- |
| type      | string               | Type of parameter, one of: `text`, `video`, `date_time`, `image`, `document`, `currency`  |
| video     | string               | Filepath or url of a video. Required for `video` type                                     |
| image     | string               | Filepath or url of an image. Required for `image` type                                    |
| document  | string               | Filepath or url of a document. Required for `document` type                               |
| date_time | [waFallbackDateTime] | Date time object. Required for `date_time` type                                           |
| currency  | [waCurrency]         | Currency object. Required for `currency` type                                             |

The `[waFallbackDateTime]` object

| Name           | Type   | Description                                                                                             |
| -------------- | ------ | ------------------------------------------------------------------------------------------------------- |
| fallback_value | string | Always use the fallback value, and Whatsapp API do not attempt to localize using other optional fields. |

The `[waCurrency]` object

| Name           | Type   | Description                            |
| -------------- | ------ | -------------------------------------- |
| amount_1000    | string | Amount multiplied by 1000              |
| code           | string | Currency code as defined in _ISO 4217_ |
| fallback_value | string | Default text if localization fails.    |

> 💡 Read **Whatsapp Cloud API** [Templates section](https://developers.facebook.com/docs/whatsapp/message-templates/guidelines) for more informations
