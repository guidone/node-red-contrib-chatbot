
`Rules node` is a multi-output node that allows to control the flow of the chatbot based on simple rules (for example _“The topic is myTopic”_, _“The context variable myVar is not defined”_). This node replace the [Topic node](https://app.notion.com/p/55036bad043447fd97b58f2a9e7365dd)  that will deprecated soon.

The first rule that matches trigger the redirect of the incoming message to the related output and stops the chain of rules.

This node is useful to create loops in the flow, for example to keep asking some questions to the user until a list of needed information (context variables) are filled.

Rules can be created programmatically by an upstream `Function node` passing array of rules in the message payload:

```javascript
msg.payload = [
  {
    type: 'hasNotVariable',
    variable: 'my_variable'
  },
  {
    type: 'catchAll'
  }
];
return msg;
```

Available parameters for the `msg.payload`

| Name  | Type            | Description       |
| ----- | --------------- | ----------------- |
| rules | array of [rule] | The list of rules |

The `[rule]` object

| Name        | Type   | Description                                                                                                                                                                                                                                            |
| ----------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| type        | string | Type of rule: _inbound_, _outbound_, _isTopicEmpty_, _catchAll_, _isNotTopic_, _isTopic_, _hasNotVariable_, _hasVariable_, _isVariable_, _command_, _messageType_, _notMessageType_, _transport_, _anyCommand_, _environment_                          |
| environment | string | Match the environment type, can be _production_ or _development_. Required for type _environment_                                                                                                                                                      |
| transport   | string | Match the transport type, can be _facebook_, _telegram_, _slack_ or _smooch_. Required for type _transport_                                                                                                                                            |
| topic       | string | Match the rule if the flow topic matches/doesn’t match the specified topic. Required for _isNotTopic_ and _isTopic_                                                                                                                                    |
| variable    | string | Match the rule if the context variable is defined/not defined. Required for _hasVariable_, _hasNotVariable_ or _isVariable_                                                                                                                            |
| value       | string | Match the rule the value of a variable. Required for _isVariable_                                                                                                                                                                                      |
| command     | string | Match the input command. Required for _command_                                                                                                                                                                                                        |
| messageType | string | Match the message type, if any. Required for _messageType_, _notMessageType_. Can be: _message_, _command_, _audio_, _buttons_, _contact_, _document_, _dialog_, _inline-buttons_, _inline-query_, _location_, _photo_, _request_, _response_, _video_ |
