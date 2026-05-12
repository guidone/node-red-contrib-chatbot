
This node will set the persistent menu next to the editable area in Facebook Messenger, there two kind of options:

- **URL**: it opens a specific url. In the mobile version it’s possible to specify the size of the browser window. Also supports [Messenger Extensions](https://developers.facebook.com/docs/messenger-platform/webview)

- **Postback**: sends the text defined in _value_ field to the chat (as a text message)

It also allows the disable the text area (user will interact only with menu with the chatbot) or to delete a previous menu. **On desktop, remember to reload the chat window in order to see the menu changes**.

The menu items can be passed through the payload by the upstream node:

```javascript
msg.payload = [  
	{    
		type: 'url',    
		label: 'JavaScript Jedi',    
		url: 'http://javascript-jedi.com',    
		webview_height_ratio: 'full' // tall|full|compact  
	},  
	{    
		type: 'postback',    
		label: 'Help',    
		value: '/help'  
	}
];
return msg;
```

otherwise all parameters can be passed by the upstream node

```javascript
msg.payload = {
	composerInputDisabled: true,  
	command: 'set',  
	items: [    
		{ 
			type: 'url',      
			label: 'JavaScript Jedi',      
			url: 'http://javascript-jedi.com',      
			webview_height_ratio: 'full' // tall|full|compact    
		},    
		{      
			type: 'postback',      
			label: 'Help',      
			value: '/help'    
		}  
	]
};
return msg;
```

A maximum 3 menu items are allowed. If more items are needed, it’s possible to create nested menus via `Function node`:

```javascript
msg.payload = {  
	composerInputDisabled: true,  
	command: 'set',  
	items: [    
		{      
			type: 'url',      
			label: 'JavaScript Jedi',      
			url: 'http://javascript-jedi.com',      
			webview_height_ratio: 'full' // tall|full|compact    
		},   
		{      
			label: 'Sub Menu',      
			items: [        
				{          
					type: 'postback',          
					label: 'Postback 1',          
					value: 'postback1'        
				},        
				{          
					type: 'postback',          
					label: 'Postback 2',          
					value: 'postback2'        
				}      
			]    
		}  
	]
};
return msg;
```

Available parameters for the `msg.payload`

| Name                  | Type            | Description                                           |
| --------------------- | --------------- | ----------------------------------------------------- |
| composerInputDisabled | boolean         | Disable text input, user will interact only with menu |
| command               | string          | Set or delete menu. Valid values: _set_, _delete_     |
| items                 | array of [item] | Items of the menu                                     |

The `[item]` object

| Name                | Type            | Description                                                                                                  |
| ------------------- | --------------- | ------------------------------------------------------------------------------------------------------------ |
| type                | string          | Type of button: _url_, _postback_                                                                            |
| label               | string          | Label of the button                                                                                          |
| value               | string          | Value returned as payload in `postback` buttons                                                              |
| url                 | string          | Url to redirect to for `url` buttons or authentication URL for `login` buttons                               |
| messengerExtensions | boolean         | Include Messenger Extensions for `url` buttons                                                               |
| webViewHeightRatio  | string          | Aspect ratio of the webview in Facebook Messenger for `url buttons`. Valid values: _tall_, _compact_, _full_ |
| items               | array of [item] | Nested menu items                                                                                            |
