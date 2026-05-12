
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

The tipical use of the buttons node is with the _Track_ option of a `Sender node` and [Rules node](https://www.notion.so/4113636f565d4ff4af08bc61a644206b) to capture the aswer

![Track answer in the Sender node](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/56c82cb6-1c83-41c9-8ec0-2c43c4a912c6/buttons-legacy.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4667BKMGAJV%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T123027Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIBHNn7b1FQkloOl4WRBJq1FwBayTaLNFJ%2B3C%2FhINXCwHAiEAuVOcFnaJbQIFq2%2FlKZEh3VWhDdCaNH9NKMkL5flkyZoq%2FwMILBAAGgw2Mzc0MjMxODM4MDUiDII8uFpZWmg4TH171CrcAzt%2BNFEEEdaemcm0vbkh285oAFrvzFNCUb1NqwtlAUpiB2El%2BvulwW2LQRwLx%2Ba%2BUzh2gQLaQssDrLs%2FEXyiRHGCaDRnopG1OKgcvLsWod3cVOQAKopMtLQhH%2BQ3VxaYcn6lirPx7WhF1gedI5kvZqz342k5oFOdZ3ihxXDedRFGXNL773eH06M60v8RTyZOJiFty%2FjwBAcVFGYExsCOG%2FDDaK2nWPlg68SmsKQLVSBmcFwH8SErWIpmIhVOD1R35LdU4OlLryVhn4c3OHBekoZei7jARE6dO70AGc9B2zN%2F%2Fir0GeEjF0XbkaBtL8avYAr9pH0BeAaOaXBcmsDJ%2F6b1cF7f0JmaFoK5nOTqxqacvfsImUBCW2QZ4Yx%2B95jfXR0W3bh2Ff9AlnEHnz8H0DZhseE8GCcg3YzBEWIIno%2Bw5b8Nu4UF%2B%2F1rXfzZd4uBlF3oDJxJ2uMBFVPyP3blVGTMD%2F2lha0Z3fDMaNIT%2BriajdsfbMSA0cYO6cGgKzanbKT41qRf4cCrY%2Bw4uxLlG6VArKoneXcojdlU36TdGp1kOdHXY74tzM%2FhMNKSWNWZHUfuNn5qa7Wgjh8f0MSpJmsyLOkR%2BBlfx2yBgDXtImon9QTkp9rCKFqClJB%2FMK2cjNAGOqUBpwyY%2FnT77NVbsSdii3RqzdPu2kTAZUh8Kq7%2FxNZlpjtGHryk0YhIYBRKKhA%2BMVTiKTV0bhKj6ZLEilmNdkhljafjOD5Go3wX2fC12JeEFkMQYggCuInBt9mAb3ZtMqpYvWuKOLaI%2F940z2Uze16Lw6I70SDxmPwLu5Tjs%2FijgBeEnaJJVuGI008DfgoDJ6lTRl9yPTMAceOFKSHLfhLIxXSdRn89&X-Amz-Signature=6c2b098d6cbb618c716d2f19612547e0f07966f3a4e722d4e03b2c25f6bb225f&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

 

In this example the `Buttons node` includes two postback buttons wiht a _label_ (it’s the label of the button) and a _value_ (it’s what will be sent back to the chatbot if clicked). The values can be anything but it’s a good habit to use Telegram-like commands, i.e. `/option1` and `/option2`, the reason for this is that they don’t interfere with user-generated sentences and can be easily filtered by a [Rules node](https://www.notion.so/4113636f565d4ff4af08bc61a644206b).
The `Sender node` uses the Track option, the answer will be captured and sent to the Rules node which can capture one of the possible answers with a rule _“Message is command …”._

The _“Track message”_ option enables a more readable layout to handle user’s answers:

![Track answer in the Buttons node](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/3b7a7638-a5ba-4316-8203-0ae783657941/buttons-new.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4667BKMGAJV%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T123027Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIBHNn7b1FQkloOl4WRBJq1FwBayTaLNFJ%2B3C%2FhINXCwHAiEAuVOcFnaJbQIFq2%2FlKZEh3VWhDdCaNH9NKMkL5flkyZoq%2FwMILBAAGgw2Mzc0MjMxODM4MDUiDII8uFpZWmg4TH171CrcAzt%2BNFEEEdaemcm0vbkh285oAFrvzFNCUb1NqwtlAUpiB2El%2BvulwW2LQRwLx%2Ba%2BUzh2gQLaQssDrLs%2FEXyiRHGCaDRnopG1OKgcvLsWod3cVOQAKopMtLQhH%2BQ3VxaYcn6lirPx7WhF1gedI5kvZqz342k5oFOdZ3ihxXDedRFGXNL773eH06M60v8RTyZOJiFty%2FjwBAcVFGYExsCOG%2FDDaK2nWPlg68SmsKQLVSBmcFwH8SErWIpmIhVOD1R35LdU4OlLryVhn4c3OHBekoZei7jARE6dO70AGc9B2zN%2F%2Fir0GeEjF0XbkaBtL8avYAr9pH0BeAaOaXBcmsDJ%2F6b1cF7f0JmaFoK5nOTqxqacvfsImUBCW2QZ4Yx%2B95jfXR0W3bh2Ff9AlnEHnz8H0DZhseE8GCcg3YzBEWIIno%2Bw5b8Nu4UF%2B%2F1rXfzZd4uBlF3oDJxJ2uMBFVPyP3blVGTMD%2F2lha0Z3fDMaNIT%2BriajdsfbMSA0cYO6cGgKzanbKT41qRf4cCrY%2Bw4uxLlG6VArKoneXcojdlU36TdGp1kOdHXY74tzM%2FhMNKSWNWZHUfuNn5qa7Wgjh8f0MSpJmsyLOkR%2BBlfx2yBgDXtImon9QTkp9rCKFqClJB%2FMK2cjNAGOqUBpwyY%2FnT77NVbsSdii3RqzdPu2kTAZUh8Kq7%2FxNZlpjtGHryk0YhIYBRKKhA%2BMVTiKTV0bhKj6ZLEilmNdkhljafjOD5Go3wX2fC12JeEFkMQYggCuInBt9mAb3ZtMqpYvWuKOLaI%2F940z2Uze16Lw6I70SDxmPwLu5Tjs%2FijgBeEnaJJVuGI008DfgoDJ6lTRl9yPTMAceOFKSHLfhLIxXSdRn89&X-Amz-Signature=62ea938dac8a7e770e556eaa83b29f6d61e2067f976525650922e6c4cbc6bd20&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

 

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
