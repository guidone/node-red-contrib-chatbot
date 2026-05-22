
The `Messenger Template node` is used to send any of the supported template in **Facebook Messenger**:

- [Generic template](https://developers.facebook.com/docs/messenger-platform/send-messages/template/generic)

- [Button template](https://developers.facebook.com/docs/messenger-platform/send-messages/template/list)

- [Media template](https://developers.facebook.com/docs/messenger-platform/send-messages/template/media)

- [Product template](https://developers.facebook.com/docs/messenger-platform/send-messages/template/product)

- [Receipt template](https://developers.facebook.com/docs/messenger-platform/send-messages/template/receipt)

- [Customer Feedback Template](https://developers.facebook.com/docs/messenger-platform/send-messages/templates/customer-feedback-template)

For the last two templates it’s not available an advanced UI, just a JSON editor where to copy and paste the payload for the desired template (read the **Facebook** documentation about how to generate it).

Two _generic templates_ can be combined together in a carousel by simply chaining `Messenger Template node` (to maximum of 10). Each template can have a maximum of 3 buttons, `title` and `subtitle` are limited to 80 chars.

_Generic templates_ and _button template_ can have up to 3 buttons, see [Buttons node](https://www.notion.so/b8f3ea33948049cca7b94491061183f4)  for a complete list of available buttons (only `quick-reply` and `location` are not available here).

In order to create a generic template in a upstream `Function node`

```javascript
msg.payload = {
  templateType: 'generic',
  title: 'my title',
  subtitle: 'I am a sub title',
  imageUrl: 'http://image.server.com/cover.png',
  buttons: [
    {
      type: 'url',
      url: 'http://javascript-jedi.com',
      label: 'Javascript Jedi'
    }
  ]
}
```

or in order to pass a collection of elements for the carousel

```javascript
msg.payload = {
  elements: [
    {
      templateType: 'generic',
      title: 'my title',
      subtitle: 'I am a sub title',
      imageUrl: 'http://image.server.com/cover.png',
      buttons: [
        {
          type: 'url',
          url: 'http://javascript-jedi.com',
          label: 'Javascript Jedi'
        }
      ]
    },
    {
      templateType: 'generic',
      title: 'another title',
      subtitle: 'Second sub title',
      imageUrl: 'http://image.server.com/cover2.png',
      buttons: [
        {
          type: 'url',
          url: 'http://javascript-jedi.com',
          label: 'Javascript Jedi'
        }
      ]
    }
  ]
}
```

Some additional parameters can like _shareable_ or _aspectRatio_ can be defined using the [Params node](https://www.notion.so/d8b27db3949c475184923af913563833) .

Available parameters for the `msg.payload`

| Name         | Type              | Description                                                                                                                                      |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| templateType | string            | Could be: _generic_, _button_, _customer_feedback_, _media_ or _product_                                                                         |
| title        | string            | Title of the list element (for _generic_ templates)                                                                                              |
| subtitle     | string            | Sub title of the list element (for _generic_ templates)                                                                                          |
| imageUrl     | string            | Url of the image element (for _generic_ templates)                                                                                               |
| buttons      | array of [button] | Array of buttons, see [Untitled](https://www.notion.so/b8f3ea33948049cca7b94491061183f4)  for more details (for _generic_ or _button_ templates) |
| mediaUrl     | string            | Url of the media element (for _media_ templates)                                                                                                 |
| mediaType    | string            | Type of media element, can be _video_ or _image_ (for _media_ templates)                                                                         |
| attachmentId | string            | Facebook attachment id (for _media_ templates)                                                                                                   |
| productId    | stgring           | Facebook product id (for _product_ templates)                                                                                                    |

The `[element]` object|

| Name     | Type              | Description                                                                                                |
| -------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| title    | string            | Title of the generic template element                                                                      |
| subtitle | string            | Sub title of the generic template element                                                                  |
| imageUrl | string            | Url of the generic template image                                                                          |
| buttons  | array of [button] | Array of buttons, see [Untitled](https://www.notion.so/b8f3ea33948049cca7b94491061183f4)  for more details |
