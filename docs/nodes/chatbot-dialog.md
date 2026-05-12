
In **Slack** it’s possible to trigger modal dialogs on the chat client. Dialogs supports three field types: `text`, `textarea` and `select` and can only be initiated by click on a button.

A dialog flow must implement 3 steps

![Example dialog node](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/cbecdc27-adf6-42f3-a16f-2d5ec7ace573/example-dialog.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4666N7PZHBU%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T122959Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJGMEQCIGAP7OrrHqwwR1vQAnk7zxV6m2pJNjobaFFZEsKrglGyAiArUwlP9V%2FEMDJLRd9aWJd8hn2MBP1FAQsIg7ey1Sjk4yr%2FAwgtEAAaDDYzNzQyMzE4MzgwNSIMkw7gHv98%2F2vmIYWqKtwDiu%2FY9GWidcDWE0Z29PPS9VGdhRGBIGEBlPPHY7RDdRFUlK77wp2CCdhF1BXwjKnmarAg3Lhlog64NERCmmdgwrSYYEXAgoWziV1ELoqsqfRmlyPWs5JmgEMSKZcexB7%2FyA%2FIhS56yjpXUwnGYSl0XDTrTJaVHrq%2FSt5jOHmSKc%2FQ7p4GI40rNWKj%2Fiifc3n1l9jeIuWWZitsh5tc3G3BkMM721rT8bcT8T1Ptw9xwyWNnyetuq5slpldBYK5LusAQMf0ZudFdaIBveWDKZt7wxY0mVu1lO5kYqTWToVUB0V84%2F7hWXIUb4Q%2BkqCmWKXTwWbIaWLW0fFnm7oBR48i5PFU%2F8WAr70tE5BUtIk%2B4n4RfISuJiIk2EUO%2BrEakLr6NrxaOj0vLt3naTz7IOZSzCLnOKIcpvOeY7a67ORCrhRAqp9fb1J%2F0glW9WVRf9VHBgkkm89fY7uWtYbg6Y3VfU5zUsxjIH3KIrLh5tK0RMrdDJKB%2FvWfm4laoGuzRGYFzgHG%2F06T9%2FqfEVVPJvOHa%2FPfc44vBXhb6fZY2c%2B5uQrfcRY6uxpPNCPKwNz2gEf0y2CQMlQvMm%2Bqo%2FewljVQrJBlIPoqjH8HgW7SmsXXkm3UQbYPJjrcMYg3XJcw452M0AY6pgG2vSWHY%2FHB0HusIGxGf%2Fxi5Ac3uc5W%2BYuV9t68ddaT4UVmpxVesanhmCtge9aMo9%2BnvSkvPWtEyFh5zzkuH4Uzv1RaWWuxl2BFBbZfdrHeVrVsFQa9HrWONSANJn8LV6dKSpAN6HvI1mR1NHJ3smIu8TmQIaLTmYlwk8x9oZf9SUMasakneg8F1WSevygC9EvetSZ9%2Bpn4hWfhQsOdmNQOorlZhIEo&X-Amz-Signature=57b5609942dd6dec30b03435bb0f7a3f70a30d393a3c32f8873144edecd9a884&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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
