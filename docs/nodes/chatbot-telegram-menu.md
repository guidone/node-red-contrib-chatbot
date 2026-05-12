
This node allows to create a persistent shortcuts menu in a Telegram bot. It’s only possible to specify commands (i.e. `/my_command`) along with a simple description.

There’s no need to connect this node with a `Telegram Receiver node` or a `Telegram Sender node`, its generally connect to a Node-RED `Inject node` which is configured to fire when the flow starts.

It’s possible to create the Telegram menu programmatically in an upstream `Function node`

```javascript
return {
	...msg,
  commands: [
		{
			command: '/command1',
			description: 'Command 1'
		},
		{
			command: '/command2',
			description: 'Command 2'
		}
	]
};
```

Available params

| Name     | Type      | Description                    |
| -------- | --------- | ------------------------------ |
| commands | [command] | The list of available commands |

The `command` entity

| Name        | Type   | Description                                                              |
| ----------- | ------ | ------------------------------------------------------------------------ |
| command     | string | Telegram command (i.e. `/my-command`), always start with a `/`. Required |
| description | string | Description of the command. Required.                                    |
