
The `Universal Connector node` allows to connect the the **RedBot** ecosystem any kind of messaging service (like email, an SMS gateway, a testing stub, etc). It’s an advanced component, a good kwowledge of **JavaScript** and _Promises_ is required in order to use it.

Unlike other receiver nodes the `Universal Connector node` has an input pin, this is where the external service will send the payload in order to be translated and injected in the **RedBot** flow. The `Universal Connector node` takes care of providing the chat context, the _pass thru_ and _track_ features, the _production_/_development_ configuration, etc; while the implementation detail about **how** the incoming message is implemented is left to the user and must be implemented with an [Extend node](https://app.notion.com/p/04668c7a415547bc9f34be57dd063db2) .

In order to properly _translate_ an incoming message the implementation in the `Universal Connector node` must:

1. Extract a **chatId** from the payload: it’s a unique identifier of the conversation in the connected platform (for example the mobile number for a SMS gateway, the email for an email system, etc) 

2. Extract or infer the message type. Some messaging platform support different type of messages (for example Telegrams supports _message_, _audio_, _photo_, etc) while a service like a SMS gateway just support one type of message. 

3. Extract the message content it also should (but is not mandatory) 

4. Extract the _timestamp_ of the message 

5. Extract a _messageId_ to properly reference inbound and outbound messages in the external service timeline

Like explained in [Extend node](https://app.notion.com/p/04668c7a415547bc9f34be57dd063db2)  a connector handles inbound messages with a chain of middlewares: chunk of codes executed sequentially in order to accomplish steps 1 to 3. In order to keep the code simple and maintainable is a good practice to let middleware takes care of detecting and translating one kind of message in each middleware, as soon as a message has been _resolved_ (means that a message _type_ is assigned to the incoming message), the rest of middlewares chain is skipped and the message is injected in the **RedBot**’s flow.

For example suppose that a SMS gateway calls the **Node-RED** instance web-hook with this payload

```javascript
{  
	sms: {    
		from: '+39347123456',    
		to: '+39338654321',    
		id: '_xyz',    
		text: 'Hello there!',    
		sender_name: 'Alan Turing'  
	}
}
```

The _from_ key is a good candidate for the _chatId_ while the content of the message is in the _text_ key. the code in the `Extend node` to handle this

```javascript
// initial stage of the process, here the message is still not enriched with all the helpers and
// variables of a RedBot message like .api(), .chat(), chatId, etc
node.chat.onChatId(message => message.sms.from);
node.chat.onMessageId(message => message.sms.id);
node.chat.in(message => {  
	return new Promise((resolve, reject) => {    
		// check that the incoming payload is an actual "text" message    
		if (message.originalMessage.sms != null && message.originalMessage.sms.text != '') {
      message.payload.type = 'message';      
			message.payload.content = message.originalMessage.sms.text;    
		}    
		resolve(message);  
	});
});
```

When a new payload arrives to the input pin the _chatId_ value is extracted from the callback `.onChatId()` (there are callbacks for other information like _messageId_, _timestamp_, _language_, etc) and a _neutral_ version of the **RedBot** message is passed to the middlewares. A _neutral message_ is a regular **RedBot** message (the messages that flow out of a receiver node) except the type and content key are left blank: is up to the developer to fill in this keys using the information contained in _originalMessage_, all values needed to build a _neutral message_ (_chatId_, _messageId_, _timestamp_, _language_) are extracted using callbacks. If the callback in `.onChatId()` fails to extract the _chatId_ then an exception is raised and the message will never go through the middlewares.

In the example above there is additional information in the payload, it’s a good practice to use the chat context for storing this information, for example

```javascript
node.chat.onChatId(payload => payload.sms.from);
node.chat.onMessageId(payload => payload.sms.id);
node.chat.in(message => {  
	const chat = message.chat();  
	// check that the incoming payload is an actual message, if not return and resolve immediately  
	// this will skip to the next middleware  
	if (message.originalMessage.sms == nulll || message.originalMessage.sms.text == null) {    
		return Promise.resolve(message);  
	}  
	// not all context provider return a promise  
	return Promise.resolve(chat.set('name', message.originalMessage.sms.sender_name))    
	.then(() => {      
		message.payload.type = 'message';      
		message.payload.content = message.originalMessage.sms.text;      
		return message;    
		});
});
```

Note that a middleware should always return a _Promise_ that returns the received message (passed as parameter of the middleware) and that will be injected in the flow (a warning on the console will log any middleware not returning a Promise).

If none of the middlewares in the inbound chain is able to infer a message type and fill in the _type_ and _content_ of the neutral message, then the message is discarded (enable the _debug_ option in the receiver configuration to log the discarded messages in the system console).

The `Universal sender node` has always an output pin used for following up the conversation or to chain multiple messages to be sent in a specific order. In the example above the code to send a SMS message to a custom API

```javascript
// this middleware handles the message of type 'message'
node.chat.out('message', message => {  
	return request(
		'https://my.api/send', 
		data: {    
			text: message.payload.content,    
			to: message.payload.chatId  
		}
	).then(response => {    
		message.status = response.statusCode;    
			// this make the chain of promises returns the message object enriched with the status code    // returned by API to be used by a downstream node    
		return message;  
	});
});
```

Like all other sender nodes there are two options:

- **Track** option: allows to track a conversation from the user: the answer of the user to a message sent with a sender with the track option will appear in the output pin in order to follow up the conversation (basically the message is teleported here). _Pay attention to this option while debugging the Universal connector and the Extend node, it will result in a alternate and strange results on the output pin_

- **Pass through** option: it will forward the **RedBot message** to the output pin. The Red message is the object that passes through the RedBot’s nodes, it contains helpers and data like _originalMessage_, _.api()_, _.chat()_. The main purpose of this is to send multiple messages to the user in a specific order. If the **Pass through** option is not checked the output pin is still present and it’s used to forward the final result of the chain of promises of an output middleware (stripped out of all helpers and data like _originalMessage_, _.api()_, _.chat()_). In the example above it’s used to forward to a downstream node the result of the call to an external custom API.

For a list of all methods available in the _msg.chat_ object see the [Extend node](https://app.notion.com/p/04668c7a415547bc9f34be57dd063db2) .
