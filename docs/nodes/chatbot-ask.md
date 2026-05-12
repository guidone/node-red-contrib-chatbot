
Show quick alternatives (canned answers) to the users with custom persistent keyboards.

The keyboard automatically closes after the user clicks on a button, the keyboard is still available after use. To completely remove a keyboard use a `Keyboard node` with an empty buttons set.

The custom keyboards can also be passed through the payload by an upstream node `Function node`

```javascript
msg.payload = {
  message: 'The message with the buttons',
  buttons: [
    {type: 'keyboardButton', label: 'label of the button 1'},
    {type: 'newline'},
    {type: 'keyboardButton', label: 'another button'}
  ]
};
return msg;
```

Available parameters for the `msg.payload`

| Name            | Type                | Description                                                            |
| --------------- | ------------------- | ---------------------------------------------------------------------- |
| message         | string              | The message text above the buttons                                     |
| buttons         | array of `[button]` | The list of inline buttons                                             |
| isPersistent    | boolean             | Keep the keyboard visible during the conversation. Default is _false_. |
| oneTimeKeyboard | boolean             | Close the keyboard after any button is pressed. Default is _false_.    |
| placeholder     | string              | Placeholder to show in the input box when the keyboard is open         |

The `[button]` object

| Name  | Type   | Description                                                                                   |
| ----- | ------ | --------------------------------------------------------------------------------------------- |
| type  | string | The type of the element, could be: _newline_ (adds a new line of buttons) or _keyboardButton_ |
| label | string | Label of the button                                                                           |
