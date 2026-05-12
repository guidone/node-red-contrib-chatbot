
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

For interactive _Blocks_ the result of the user interactions is sent to the chatbot as a `response` type message (like [Slack Dialog node](https://www.notion.so/e620ae50b7ed44c2a24d6876534b3637) ), the payload is an hash object that contains the _block_id_ of the UI element (a button, a dropdown, etc) and related _value_. If the _block_id_ is not specified in the JSON, it will be auto-generated one.

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

![Example Slack Blocks](https://prod-files-secure.s3.us-west-2.amazonaws.com/b55ba134-c1dd-4ca1-9942-d1fe66c465a2/1056fb7e-c18a-4972-aa30-0e3fca3bf150/slack-blocks.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB466Z7KIWPGV%2F20260512%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20260512T123033Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEGQaCXVzLXdlc3QtMiJHMEUCIGziPordPMiPIrAMJNS3lzMJuj0dCtu%2FqrosCtJZGcOBAiEAsw%2BGE0gh4FcA%2BdGTTwOXJoMMwENLTy3BSiiOzV4yPtoq%2FwMILRAAGgw2Mzc0MjMxODM4MDUiDFOz1sNyxvLlFz3NLyrcA4vfSC6571exYOdZPNTFAKV1nUIEE08Vhvrd%2F6cBnKNgCNEt1TMVa784IetcROuPkIWaCe9EViA3YndBK%2BZesxtI%2B9rVUz57UDObnLktaDPlDBH8fiuKxtGYrPsuC2cF4LSuyRMZDPmRETcHpBuubAv5gXXCGQ4DYqFpINlMwI02BMp9tvkZPDgsbRMG1iUtqDvVd0OzajbcDTYoYB2bzZ5Rf4PV5m9pqa3MM%2FZpOyhYuCiQptd1V2Z5My2QKGnb%2BnO6WPIxdJ9ShG33NV74wHpHkp%2BlFHg193u2085Rt5h6QApofIjgci6qFTQVMB%2B6glHLTuCcKSgHNe10jqcnyKjTMSeeKetZRXE0qzbvJoBQiQ5IEjgQtZp%2Bwqs1Pbrpt%2B2rr4k7Z53JArvrfOaxXMfDDOq3KRMSLKz5zd%2FCEpi6ifGJj8l%2FF%2BjtvLvWMeqbgD%2FpxAoZUSwBqaZ8MaRwZZOkFA61Wq6EoTRRASPVydS7O5XvaodBt8o4z1bUPEgGVVh5Yb1dBcGjyZy9tzzeWxcRmj%2FihhiuUlxPUA183H8cEKyk8%2B7MD4C2%2F9hvXD%2FFTVj%2F694lhvaHrUpmGBW%2FI17hHsCtNlHg9JVvQkI2NrYANt13%2B%2FBdU407e81iMOmejNAGOqUBXuoV0Y5rt1vwTDhxubpePfzTB90CxFMKWNn1h0AE%2FBGvo5v84Al2oPKbuAAmL0dBaGIanqx2OIg1bbt0bQT93CQWe14Gl9mznY4Xf3X7Z%2FaZgj9H%2BjIWcYlXBe%2B7ok4KIqC12Ck%2FJPdIkAgxBYtCc7haMuQOz3AY2USfxBlzIyIxnkrLHvERRMgTlow8cxjc302qKtn5HmU7sCyZuGGYInvq%2BOYb&X-Amz-Signature=cf6f50941c2983029cbf1a64049455d64a4993104fbdc6e441de82c539ebfbfe&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

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
