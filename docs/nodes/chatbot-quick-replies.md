
`Quick Replies node` provide a way to present buttons to the user in response to a message in **Facebook Messenger**.

Quick Replies appear prominently above the composer, with the keyboard less prominent. When a quick reply is tapped, the message is sent in the conversation with developer-defined metadata in the callback.

After the user taps one, they are dismissed, which prevents the scenario where users could tap on buttons attached to old messages in a conversation.

Only three types of buttons can be specified here: 

- **quick-reply**: very similar to `postback` (see `Buttons node` for more details), has a _label_ and _value_ (which is the text sent back to the chat when the button is pressed). The button can also have an icon with specified by the _url_ field

- **email**: allows the user to share his email 

- **phone**: allows the user to share his phone number

The text message can be passed through the payload by the upstream node:

```javascript
return {  
  ...msg,
  message: 'Select one',  
  buttons: [    
		{ type: 'quick-reply', label: 'Test 1', value: 'test1' },    
    { type: 'quick-reply', label: 'Test 2', value: 'test2' }  
];
```

Available parameters for the `msg.payload`

| Name    | Type      | Description                      |
| ------- | --------- | -------------------------------- |
| message | string    | The text above the quick replies |
| buttons | [buttons] | The quick-reply button           |

The `button` object

| Name      | Type   | Description                                                 |
| --------- | ------ | ----------------------------------------------------------- |
| type      | string | Type of quick reply button: _quick-reply_, _email_, _phone_ |
| label     | string | The label of the button (only for _quick-reply_)            |
| value     | string | The value returned when clicked (only for _quick-reply_)    |
| image_url | string | The image for the button (only for _quick-reply_)           |
