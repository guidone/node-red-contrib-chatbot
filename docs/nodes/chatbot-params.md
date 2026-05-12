
The `Params node` is used to specify some platform related parameters or flag. For example in **Telegram** it’s possible to deliver a message silently while in **Twilio** it’s possible to specify the originator number (overriding the bot configuration).

The text-like values of parameters also accepts chat contexts variables. For example in **Telegram** to modify the previous sent message instead of sending a new one, just add a parameter, select platform **Telegram** then select _“Modify message”_ and then type `{{outboundMessageId}}`

![Modify message](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/159083b5-2efd-4d12-b603-51634fade887/modify-message.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466SLDKQWND%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T123034Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIEpb7u%2BawRt3JC%2BQiOAn%2BQUmPYyiarYJ0jnS8L%2BUamulAiEApqiZnrT5DrnWEsNVa%2BIRcqCJLRk%2BR%2F5QSWB4ocAxTpEq%2FwMILRAAGgw2Mzc0MjMxODM4MDUiDIaBmkcpobYpNqflGCrcA%2FF1i1SFS4q7WZwELh6j5oy6S6t1G9aatjSmFVk5wXNVNRmEdN7ruRG%2FySf4KPXn8HyQqowtjSBucNnLfkcyF7Nu9WAWrSIrYtOl1VRgBqLo9FHa1GPomfA8NR5HAV3q6%2FUqO917tz6DRjcCugYk9D%2F7mff5PDuht9BbGunUU4fghj0uHJ%2B45wNBW3mo0kKCcXj3nrk67NF1XBsC9QqzAWbhG9vND8ieW5s2Xx6nWa4Lks3PuLYC%2BgOC%2FtEgchLjCOXtFuQYMKxwY9gUmSU5MJYRs38z%2FPLw1CiTG9vvkT4dsthSp65Q%2FBotPr3Ut6m723W14hqXbt6l0M3m2u8h2u%2FUWcLppzkWu%2By0Z6KDfJj6v262dUTQsdbbwhC%2BwmJ5vuwsa35vIaLciSMnhSJGDUtVaxmUKaNCqygsnjcJKeoLchsMvT%2BfuQkcQEd1OcLZmgxqVrg2beTxx9mFINwQTZRiYezRVd0THjnz%2FLFU97fJZp2riTx1RltINIOescA%2BEvOiuvDqJ35XUXwjtt%2BtO65Hlz78WlO3LXsR104IRU9TpL%2F6cpoZFRhA5djNNiqW7%2BV0JIbVYvKdz2qQY30slopInDGdTvrHeZ1Fp%2Bq3j1xAAQxsxtBjRS1AzC2DMI2djNAGOqUBgHkCZ54dYgx3Ek3bqKnjvJ5gs%2BKeJvSxgEPINAuDfc8KUBu5aJPCzsFSiF61YJE5ZQyIckdyiafaubEx1jR4CbDOieV8BsCIhTkk6PUFFgy%2F8Fm46AZTvm1DzYlcF5spuTipmRe8n%2Fb8Lk7ecjowOHCumm129nfKhNfPEtjimNqaWNil6jU28foOs7w409Cx1u7vEVLfZhmRys9MSM8Qj3aT6ExR&X-Amz-Signature=555ae888c3d7c6167dd804c210892a3357d5b24f823a47d7a3daeb8ccb620563&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

The same chat context value `{{outboundMessageId}}` can be used, for example, to delete a previous message.

The same can obtained with in a upstream `Function node`:

```javascript
msg.params = [  
  { platform: 'telegram', name: 'modifyMessageId', value: '{{outboundMessageId}}'
];
return msg;
```

Available parameters for the `msg.payload`

| Name   | Type             | Description                                    |
| ------ | ---------------- | ---------------------------------------------- |
| params | array of [param] | Array of parameters to send to the Sender node |

The _param_ object

| Name     | Type   | Description                                                                                         |
| -------- | ------ | --------------------------------------------------------------------------------------------------- |
| platform | string | The specific platform (transport) this parameter is used for (_telegram_, _slack_, _facebook_, etc) |
| name     | string | The name of the parameter                                                                           |
| value    | any    | The value of the parameter                                                                          |

> ❗ The chat context `messageId` is deprecated, it was used ambiguously in previous versions to refer both the last inbound and outbound message. It’s replace by `outboundMessageId` (the id of the last message sent by the chatbot to the user) and `inboundMessageId` (the id of the last message received by the chatbot from the user).  
>For retro-compatibility `messageId` is still available. 
