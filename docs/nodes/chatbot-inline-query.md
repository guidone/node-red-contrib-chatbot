
Inline mode allows the user to query a chatbot from a different chat, it’s a powerful tool to make your chatbot go viral, read more [here](https://core.telegram.org/bots/inline).

Every query invoked with a line like `@mychatbot how are you?` are routed through the [Telegram Receiver node](https://app.notion.com/p/4132ce6c78dc4dbbab0fe9eb7e1c3c9b)  as a message of type `inline-query`, it will look like

```javascript
{
  originalMessage: {
    // ...
  },
  payload: {
    content: 'how are you?',
    type: 'inline_query',
    // ...
  }
}
```

and can be sent to any other parser nodes like other messages.

At some point of the flow it might be useful to route the incoming message on a different path based on the type, for example in order to handle the inline query differently, here is where the `Switch node` might be useful

![Switch node example](./docs/assets/bf75757aabfcaaaa.png)

After a inline query is received, use a `Function node` to prepare the payload to send to a `Inline Query Results node` and then to a `Telegram Sender node`.

The `Function node`

```javascript
msg.payload = [
  {
    type: 'article',
    id: 'AAA-123',
    title: 'Title #1',
    input_message_content: {
      message_text: 'You selected title #1',
    }
  },
  {
    type: 'article',
    id: 'AAA-124',
    title: 'Title #2',
    input_message_content: {
      message_text: 'You selected title #2'
    }
  }
]
return msg;
```

Learn more [here](https://core.telegram.org/bots/api#inline-mode) about what kind of message it’s possible to send as inline query answer.

Available parameters for `msg.payload`

| Name              | Type         | Description                                              |
| ----------------- | ------------ | -------------------------------------------------------- |
| inlineQueryAnswer | array of obj | The query results to show to the client                  |
| caching           | integer      | How long results are cached, in seconds                  |
| personal          | boolean      | If the results should be presented privately to the user |
