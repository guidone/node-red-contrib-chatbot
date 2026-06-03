
[Block Kit](https://api.slack.com/block-kit) is a **Slack** framework to create complex interactions with the chatbot (panels, buttons, UI elements), the _“Block”_ can be visually composed using the [Block Kit Builder](https://api.slack.com/tools/block-kit-builder).

When the _Block_ is ready, just copy and paste the JSON in the `Slack Blocks node`, for example:

```javascript
{  
	"text": "Fallback text",
  "blocks": [    
		{      
			"type": "section",      
			"text": { 
				"type": "mrkdwn",        
				"text": "Hello *{{firstName}}*"      
			}    
		},    
		{      
			"type": "actions",      
			"block_id": "my_block_id",      
			"elements": [        
				{          
					"type": "button",          
					"text": {            
						"type": "plain_text",            
						"text": "Say Hello",            
						"emoji": true          
					},          
					"value": "the_value"        
				}      
			]    
		}  
	]
}
```

In any part of the JSON is also possible to use the chat context variables.

For interactive _Blocks_ the result of the user interactions is sent to the chatbot as a `response` type message (like [Slack Dialog node](https://app.notion.com/p/e620ae50b7ed44c2a24d6876534b3637) ), the payload is an hash object that contains the _block_id_ of the UI element (a button, a dropdown, etc) and related _value_. If the _block_id_ is not specified in the JSON, it will be auto-generated one.

For example clicking the button in the example above will send the following message to the chatbot

```javascript
{  
	type: 'response',  
	content: {    
		my_block_id: 'the_value'  
	}
}
```

A `response` type message can be chained directly to a [[Context node|Context-node]] to store the results directly in the current user chat context.

![Example Slack Blocks](./docs/assets/81bfd81edb5889e3.png)

The JSON can be passed through the payload by the upstream node:

```javascript
msg.payload = {  
	blocks: '[{ ... }]'
};
```

Available parameters for the `msg.payload`

| Name   | Type   | Description                                                                         |
| ------ | ------ | ----------------------------------------------------------------------------------- |
| blocks | string | The JSON string of the Slack Block                                                  |
| text   | string | The fallback string to be used when blocks cannot be displayed (i.e. notifications) |
