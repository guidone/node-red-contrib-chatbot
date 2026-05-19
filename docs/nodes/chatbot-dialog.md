
In **Slack** it’s possible to trigger modal dialogs on the chat client. Dialogs supports three field types: `text`, `textarea` and `select` and can only be initiated by click on a button.

A dialog flow must implement 3 steps

![Example dialog node](./docs/assets/649481c63170358e.png)

1. Add a `Open Dialog` button in a `Inline button node` or `Generic Template node`. Specify _Modal id_ if there are several dialog forms

2. When a user clicks on a `Open Dialog` button, a message type `dialog` is triggered from the `Slack Receiver node`, the content of the payload is the _Modal id_ specified in the button. At this point the chat flow should answer with a `Dialog node` which defines the modal fields. Use the `Switch node` to redirect incoming messages based on type.

3. When the user answers to a modal dialog, a message type `response` is triggered from the `Slack Receiver node`, and contains the response hash (key is the name of the field, value is the answer). In order to extract the hash from the `response` message use a `Parse node` using the _Dialog response_ type. Use the `Switch node` to redirect the `response` message to the proper `Parse node`.

After the parse node the `message.payload` will contain

```javascript
{
  my_text_field: 'test',
  my_textarea_field: 'sadasda',
  my_select_field: 'one'
}
```

| Name        | Type              | Description                                             |
| ----------- | ----------------- | ------------------------------------------------------- |
| title       | string            | The title of the modal dialog. Required                 |
| submitLabel | string            | The label of the submit button                          |
| messageId   | string            | The message id to modify, leave blank for a new message |
| elements    | array of elements | The elements of the modal form. Required                |

The `element` structure

| Name        | Type            | Description                                                                  |
| ----------- | --------------- | ---------------------------------------------------------------------------- |
| type        | string          | Type of element: _text_, _textarea_, _select_. Required                      |
| label       | string          | The label form element. Required                                             |
| name        | string          | The name of the element, also used in hash result. Required                  |
| value       | string          | The initial value of the element                                             |
| placeholder | string          | Placeholder text of the form element                                         |
| hint        | string          | Little help below the form element                                           |
| optional    | boolean         | If the form element is optional, if not specified is mandatory               |
| subtype     | string          | Sub-type for _text_ and _textarea_ elements: _email_, _number_, _tel_, _url_ |
| minLength   | number          | Minimum length for _text_ and _textarea_ elements                            |
| maxLength   | number          | Maximum length for _text_ and _textarea_ elements                            |
| options     | array of option | Options of the combo box for _select_ elements                               |

The `option` structure

| Name  | Type   | Description                       |
| ----- | ------ | --------------------------------- |
| value | string | The value of the option. Required |
| label | string | The label of the option. Required |

For example, in order to programmatically prepare the the modal form in a upstream `Function node`:

```javascript
msg.payload = {
  title: 'My form',
  submitLabel: 'OK',
  elements: [
    {
      type: 'text',
      name: 'my_text',
      label: 'My Text'
    },
    {
      type: 'select',
      name: 'my_combo',
      label: 'My Combo',
      options: [
        { value: 'option_1', label: 'Option 1' },
        { value: 'option_2', label: 'Option 2' }
      ]
    }
  ]
}
```
