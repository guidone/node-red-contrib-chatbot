
Get, set or delete an element in the chat context.

The chat context is a volatile namespace for variables related to the current chat user, some variables are predefined (like _firstName_, _lastName_, _topic_, _chatId_, etc).

Typically this node is used to manually set the _topic_ of the user before or after entering a [Rivescript node](https://www.notion.so/db8481a702b6491093f7ea53d765129e)  or to store the extracted variables of an [Intent payload](https://www.notion.so/b4bd4f8db5d243d487430d073c35992b) .

For example, nodes like [Dialogflow node](https://www.notion.so/84b9ea66d20743fd9cf45d3de5f17693)  can extract the _intent_ from a sentences along with some variables (numbers, dates, etc). Chaining a [Context node](https://www.notion.so/24a646bff58b4edfb249f1d27384230f)  stores these vars in the chat context

![Store Intent vars](./docs/assets/9400497243b24334.png)

Available parameters for the `msg.payload`

| Name       | Type   | Description                                                                             |
| ---------- | ------ | --------------------------------------------------------------------------------------- |
| command    | string | Operation to do on the context: _get_, _set_, _delete_, _intent_                        |
| fieldType  | string | Type of field to set. Required for command: _set_. Can be: _str_, _num_, _bol_, _json_. |
| fieldValue | string | The value to be set. Required for command: _set_                                        |
| fieldName  | string | The name of the chat context variable. Required for command: _set_, _get_, _delete_     |

This node is available for all platforms.
