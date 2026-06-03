
This node creates a message with one or more buttons in order to get a quick reaction from the users. 

Available buttons: 

- **URL**: Open a URL inside the client. Button feedbacks are available for Telegram and Messenger extensions in Facebook _[Telegram, Facebook, Viber]_

- **Postback**: Allow the user to send a predefined message, the message will no be shown in the chat history. Button feedbacks are available for Telegram and Messenger extensions in Facebook _[Telegram, Facebook, Smooch, Viber]_

- **Phone call**: Starts a phone call on mobile. _[Facebook]_

- **Log In**: Starts the account linking flow. _[Facebook]_

- **Log Out**: Starts the account unlinking flow. _[Facebook]_

- **New row**: Telegram supports buttons layout with multiple row, this element just starts a new one. _[Telegram, Viber]_

Platform exceptions: 

- **Telegram** supports a visual feedback, visible in the client, when a `Postback` or `URL` buttons is pressed

- **Facebook** supports some extra parameters in the `URL` button, like the size of the web view and [messenger extensions](https://developers.facebook.com/docs/messenger-platform/webview) and a maximum od three buttons.

The tipical use of the buttons node is with the _Track_ option of a `Sender node` and [Rules node](https://app.notion.com/p/4113636f565d4ff4af08bc61a644206b) to capture the aswer

![Track answer in the Sender node](./docs/assets/fe9082ffcef93ddf.png)

 

In this example the `Buttons node` includes two postback buttons wiht a _label_ (it’s the label of the button) and a _value_ (it’s what will be sent back to the chatbot if clicked). The values can be anything but it’s a good habit to use Telegram-like commands, i.e. `/option1` and `/option2`, the reason for this is that they don’t interfere with user-generated sentences and can be easily filtered by a [Rules node](https://app.notion.com/p/4113636f565d4ff4af08bc61a644206b).
The `Sender node` uses the Track option, the answer will be captured and sent to the Rules node which can capture one of the possible answers with a rule _“Message is command …”._

The _“Track message”_ option enables a more readable layout to handle user’s answers:

![Track answer in the Buttons node](./docs/assets/fac266e7b10d691e.png)

 

In that case the user’s answer will be tracked directly by the `Buttons node` through one of the outputs related the postback buttons (hover on the outputs to know the output details).
The first pin of the `Buttons node` is always to be connected to a `Sender node` while the last pin is the fallback (in case the user, for example, writes something instead of clicking the buttons). 

Buttons can be created programmatically by an upstream `Function node` passing array of buttons in the message payload:

```javascript
msg.payload = {
  message: 'This is a message above the buttons',
  buttons: [
    {
      type: 'url',
      url: 'http://javascript-jedi.com',
      label: 'Javascript Jedi'
    },
    {
      type: 'postback',
      value: 'MY_POSTBACK_MESSAGE',
      label: 'Click me!'
    },
    {
      type: 'share'
    }
  ]
};
return msg;
```

Available parameters for the `msg.payload`

| Name         | Type              | Description                                                                                                                                     |
| ------------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| message      | string            | The message text above the buttons                                                                                                              |
| buttons      | array of [button] | The list of inline buttons                                                                                                                      |
| trackMessage | boolean           | Track the answer message in the `Buttons node`, the answer will be redirected to one of output pins related to the buttons. Default is `false`. |

The `[button]` object

| Name                | Type    | Description                                                                                                  |
| ------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| type                | string  | Type of button: _url_, _postback_, _quick-reply_, _location_, _call_, _share_, _login_, _logout_, _newline_  |
| label               | string  | Label of the button                                                                                          |
| value               | string  | Value returned as payload in `postback` buttons                                                              |
| url                 | string  | Url to redirect to for `url` buttons or authentication URL for `login` buttons                               |
| number              | string  | Phone number to call for `call` buttons                                                                      |
| messengerExtensions | boolean | Include Messenger Extensions for `url` buttons                                                               |
| answer              | string  | The feedback shown on Telegram client for `url` and `postback` buttons                                       |
| alert               | boolean | Show the feedback as alert on Telegram client for `url` and `postback` buttons                               |
| style               | string  | Style of buttons in Slack: _default_, _primary_, _danger_                                                    |
| webViewHeightRatio  | string  | Aspect ratio of the webview in Facebook Messenger for `url buttons`. Valid values: _tall_, _compact_, _full_ |
